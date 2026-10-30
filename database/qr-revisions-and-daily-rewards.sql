ALTER TABLE bbsilog_private.web_orders ADD COLUMN checkout_id uuid, ADD COLUMN invalidated_reason text;
CREATE UNIQUE INDEX one_pending_qr_per_checkout ON bbsilog_private.web_orders(checkout_id) WHERE status='pending' AND checkout_id IS NOT NULL;
CREATE UNIQUE INDEX one_review_voucher_per_phone_ph_day ON bbsilog_private.review_vouchers(phone,((created_at AT TIME ZONE 'Asia/Manila')::date));
CREATE OR REPLACE FUNCTION public.bbsilog_create_order(p_request jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE o bbsilog_private.web_orders; v bbsilog_private.review_vouchers; c bbsilog_private.order_catalog; i jsonb; q int; total numeric:=0; unknown boolean:=false; canon jsonb:='[]'; ph text; kind text; pay text; nm text; rid uuid; checkout uuid;
BEGIN
 IF jsonb_typeof(p_request)<>'object' THEN RAISE EXCEPTION 'Invalid order'; END IF;
 rid:=(p_request->>'request_id')::uuid;
 checkout:=coalesce(nullif(p_request->>'checkout_id','')::uuid,rid);
 IF checkout IS NULL THEN RAISE EXCEPTION 'Invalid checkout session'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('checkout:'||checkout::text,0));
 PERFORM pg_advisory_xact_lock(hashtextextended(rid::text,0));
 SELECT * INTO o FROM bbsilog_private.web_orders WHERE request_id=rid;
 IF FOUND THEN
  IF o.status<>'pending' THEN RAISE EXCEPTION 'This QR is no longer valid. Confirm your updated order to generate a new QR.'; END IF;
  IF o.request_body<>p_request THEN RAISE EXCEPTION 'Order changed. Create a new request.'; END IF;
  RETURN jsonb_build_object('token',o.token,'code',o.code,'subtotal',o.subtotal,'unpriced',o.unpriced,'discount_rate',o.discount_rate);
 END IF;
 nm:=trim(p_request->>'name'); ph:=regexp_replace(coalesce(p_request->>'phone',''),'[^0-9]','','g');
 IF ph LIKE '639%' THEN ph:='0'||substr(ph,3); END IF;
 IF length(nm)<2 OR length(nm)>80 OR ph !~ '^09[0-9]{9}$' THEN RAISE EXCEPTION 'Enter a valid name and Philippine mobile number'; END IF;
 kind:=p_request->>'fulfillment'; pay:=p_request->>'payment';
 IF kind NOT IN('Pickup','Delivery','Dine-in') OR pay NOT IN('Cash','GCash') OR kind IS NULL OR pay IS NULL THEN RAISE EXCEPTION 'Invalid service or payment'; END IF;
 IF kind='Delivery' AND (p_request->>'zone' IS DISTINCT FROM 'local' OR length(trim(coalesce(p_request->>'address','')))<5) THEN RAISE EXCEPTION 'Delivery is South Caloocan near Pajo only'; END IF;
 IF length(coalesce(p_request->>'address',''))>500 OR length(coalesce(p_request->>'notes',''))>1000 THEN RAISE EXCEPTION 'Address or notes too long'; END IF;
 IF jsonb_typeof(p_request->'items') IS DISTINCT FROM 'array' OR jsonb_array_length(p_request->'items') NOT BETWEEN 1 AND 40 THEN RAISE EXCEPTION 'Choose 1 to 40 menu items'; END IF;
 FOR i IN SELECT value FROM jsonb_array_elements(p_request->'items') LOOP
  q:=(i->>'qty')::int;
  IF q IS NULL OR q NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Quantity must be 1 to 50'; END IF;
  SELECT * INTO c FROM bbsilog_private.order_catalog WHERE name=i->>'name';
  IF NOT FOUND THEN RAISE EXCEPTION 'Menu item unavailable'; END IF;
  total:=total+coalesce(c.price,0)*q; unknown:=unknown OR c.price IS NULL;
  canon:=canon||jsonb_build_array(jsonb_build_object('name',c.name,'qty',q,'price',c.price));
 END LOOP;
 IF nullif(p_request->>'voucher','') IS NOT NULL THEN
  SELECT * INTO v FROM bbsilog_private.review_vouchers WHERE code=(p_request->>'voucher')::uuid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid voucher QR'; END IF;
  IF v.used_at IS NOT NULL THEN RAISE EXCEPTION 'QR code has been used'; END IF;
  IF v.expires_at<now() THEN RAISE EXCEPTION 'Voucher has expired'; END IF;
  IF v.phone<>ph THEN RAISE EXCEPTION 'Voucher belongs to a different mobile number'; END IF;
 END IF;
 UPDATE bbsilog_private.web_orders SET status='cancelled',invalidated_reason='Replaced by a newly confirmed checkout QR' WHERE checkout_id=checkout AND status='pending';
 INSERT INTO bbsilog_private.web_orders(checkout_id,request_id,request_body,customer_name,phone,fulfillment,payment,address,notes,items,subtotal,unpriced,discount_rate,voucher)
 VALUES(checkout,rid,p_request,nm,ph,kind,pay,coalesce(p_request->>'address',''),coalesce(p_request->>'notes',''),canon,total,unknown,CASE WHEN v.code IS NULL THEN 3 ELSE 5 END,v.code) RETURNING * INTO o;
 RETURN jsonb_build_object('token',o.token,'code',o.code,'subtotal',o.subtotal,'unpriced',o.unpriced,'discount_rate',o.discount_rate);
END $$;
CREATE OR REPLACE FUNCTION public.bbsilog_submit_order_review(p_token uuid,p_review jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE o bbsilog_private.web_orders; feedback_id bigint; v bbsilog_private.review_vouchers; photo text; reward_day date:=(now() AT TIME ZONE 'Asia/Manila')::date;
BEGIN
 SELECT * INTO o FROM bbsilog_private.web_orders WHERE token=p_token FOR UPDATE;
 IF NOT FOUND OR o.status<>'completed' THEN RAISE EXCEPTION 'Review reward unlocks after staff completes your paid order'; END IF;
 IF o.review_id IS NOT NULL THEN RAISE EXCEPTION 'A review was already submitted for this order'; END IF;
 IF (p_review->>'rating')::int NOT BETWEEN 1 AND 5 OR p_review->>'rating' IS NULL OR length(trim(coalesce(p_review->>'message',''))) NOT BETWEEN 1 AND 1500 THEN RAISE EXCEPTION 'Choose a rating and write a review'; END IF;
 photo:=nullif(p_review->>'photo_path','');
 IF photo IS NOT NULL AND (photo !~ '^incoming/[0-9a-f-]{36}[.]webp$' OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='bbsilog-feedback-photos' AND name=photo)) THEN RAISE EXCEPTION 'Photo unavailable. Choose it again.'; END IF;
 INSERT INTO public.bbsilog_feedback(customer_name,rating,message,publish_consent,photo_path,photo_layout,photo_consent)
 VALUES(left(coalesce(nullif(trim(p_review->>'customer_name'),''),o.customer_name),80),(p_review->>'rating')::smallint,trim(p_review->>'message'),coalesce((p_review->>'publish_consent')::boolean,false),photo,CASE WHEN photo IS NOT NULL THEN p_review->>'photo_layout' END,photo IS NOT NULL AND coalesce((p_review->>'photo_consent')::boolean,false)) RETURNING id INTO feedback_id;
 PERFORM pg_advisory_xact_lock(hashtextextended('daily-review:'||o.phone||reward_day::text,0));
 IF EXISTS(SELECT 1 FROM bbsilog_private.review_vouchers WHERE phone=o.phone AND (created_at AT TIME ZONE 'Asia/Manila')::date=reward_day) THEN
  UPDATE bbsilog_private.web_orders SET review_id=feedback_id WHERE token=o.token;
  RETURN jsonb_build_object('eligible',false,'discount_rate',5,'message','Salamat! Your review was saved. You already received your one 5% voucher today. You can earn another starting tomorrow (Philippine time).');
 END IF;
 INSERT INTO bbsilog_private.review_vouchers(order_token,phone) VALUES(o.token,o.phone) RETURNING * INTO v;
 UPDATE bbsilog_private.web_orders SET review_id=feedback_id,reward=v.code WHERE token=o.token;
 RETURN jsonb_build_object('eligible',true,'voucher',v.code,'discount_rate',5,'expires_at',v.expires_at,'message','Your one 5% review voucher for today is ready. Valid for 30 days, one use, same mobile number. Another reward is available tomorrow (Philippine time).');
END $$;
CREATE OR REPLACE FUNCTION public.bbsilog_order_receipt(p_token uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE o bbsilog_private.web_orders;
BEGIN
 SELECT * INTO o FROM bbsilog_private.web_orders WHERE token=p_token;
 IF NOT FOUND THEN RAISE EXCEPTION 'Invalid order QR'; END IF;
 RETURN to_jsonb(o)-'request_body'-'request_id'-'checkout_id'-'voucher';
END $$;
CREATE OR REPLACE FUNCTION public.bbsilog_admin_qr(p_code text,p_action text DEFAULT 'verify',p_unpriced_total numeric DEFAULT 0,p_delivery_fee numeric DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE o bbsilog_private.web_orders; v bbsilog_private.review_vouchers; food numeric; isvoucher boolean:=false;
BEGIN
 IF NOT public.bbsilog_is_feedback_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
 IF p_action NOT IN('verify','complete','cancel','redeem') THEN RAISE EXCEPTION 'Invalid action'; END IF;
 IF p_unpriced_total IS NULL OR p_delivery_fee IS NULL OR p_unpriced_total<0 OR p_delivery_fee<0 OR p_unpriced_total>100000 OR p_delivery_fee>10000 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
 SELECT * INTO o FROM bbsilog_private.web_orders WHERE token::text=trim(p_code) OR code=upper(trim(p_code)) FOR UPDATE;
 IF NOT FOUND THEN
  SELECT * INTO v FROM bbsilog_private.review_vouchers WHERE code::text=trim(p_code) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid QR code'; END IF;
  isvoucher:=true;
  IF v.used_at IS NOT NULL THEN RETURN jsonb_build_object('type','voucher','used',true,'error','QR code has been used','data',to_jsonb(v)); END IF;
  IF v.expires_at<now() THEN RAISE EXCEPTION 'Voucher has expired'; END IF;
  IF p_action='redeem' THEN
   IF p_unpriced_total<=0 THEN RAISE EXCEPTION 'Enter confirmed food subtotal'; END IF;
   INSERT INTO bbsilog_private.web_orders(request_id,request_body,customer_name,phone,fulfillment,payment,items,subtotal,discount_rate,voucher,status,completed_at,final_food,delivery_fee,discount_amount,final_total)
   VALUES(gen_random_uuid(),'{}','Review voucher redemption',v.phone,'Pickup','Cash','[]',p_unpriced_total,5,v.code,'completed',now(),p_unpriced_total,p_delivery_fee,round(p_unpriced_total*.05,2),p_unpriced_total-round(p_unpriced_total*.05,2)+p_delivery_fee) RETURNING * INTO o;
   UPDATE bbsilog_private.review_vouchers SET used_at=now(),used_by=o.token WHERE code=v.code;
   RETURN jsonb_build_object('type','order','used',true,'redeemed',true,'data',to_jsonb(o)-'request_body');
  ELSIF p_action<>'verify' THEN RAISE EXCEPTION 'Scan an order QR to complete an order'; END IF;
  RETURN jsonb_build_object('type','voucher','used',false,'data',to_jsonb(v),'discount_rate',5);
 END IF;
 IF o.status='completed' THEN RETURN jsonb_build_object('type','order','used',true,'error','QR code has been used','data',to_jsonb(o)-'request_body'); END IF;
 IF o.status='cancelled' THEN RAISE EXCEPTION 'Invalid QR: %',coalesce(o.invalidated_reason,'Order cancelled'); END IF;
 IF p_action='cancel' THEN UPDATE bbsilog_private.web_orders SET status='cancelled' WHERE token=o.token RETURNING * INTO o;
 ELSIF p_action='complete' THEN
  IF NOT o.unpriced AND p_unpriced_total<>0 THEN RAISE EXCEPTION 'This order has no unpriced items'; END IF;
  IF o.unpriced AND p_unpriced_total<=0 THEN RAISE EXCEPTION 'Enter the confirmed total for unpriced items'; END IF;
  IF o.voucher IS NOT NULL THEN
   SELECT * INTO v FROM bbsilog_private.review_vouchers WHERE code=o.voucher FOR UPDATE;
   IF v.used_at IS NOT NULL THEN RAISE EXCEPTION 'QR code has been used'; END IF;
   IF v.expires_at<now() THEN RAISE EXCEPTION 'Voucher has expired'; END IF;
  END IF;
  food:=o.subtotal+p_unpriced_total;
  UPDATE bbsilog_private.web_orders SET status='completed',completed_at=now(),final_food=food,delivery_fee=p_delivery_fee,discount_amount=round(food*discount_rate/100,2),final_total=food-round(food*discount_rate/100,2)+p_delivery_fee WHERE token=o.token RETURNING * INTO o;
  IF o.voucher IS NOT NULL THEN UPDATE bbsilog_private.review_vouchers SET used_at=now(),used_by=o.token WHERE code=o.voucher; END IF;
 ELSIF p_action<>'verify' THEN RAISE EXCEPTION 'Invalid order action'; END IF;
 RETURN jsonb_build_object('type','order','used',o.status='completed','data',to_jsonb(o)-'request_body');
END $$;
CREATE FUNCTION public.bbsilog_cancel_order_qr(p_token uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE o bbsilog_private.web_orders;
BEGIN
 SELECT * INTO o FROM bbsilog_private.web_orders WHERE token=p_token FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Invalid order QR'; END IF;
 IF o.status='pending' THEN
  UPDATE bbsilog_private.web_orders SET status='cancelled',invalidated_reason='Customer went back to revise the order'
  WHERE token=p_token RETURNING * INTO o;
 END IF;
 RETURN jsonb_build_object('status',o.status,'valid',false,'message',CASE WHEN o.status='completed' THEN 'QR code has been used' ELSE 'QR invalidated. Confirm your revised order to generate a new QR.' END);
END $$;
CREATE FUNCTION public.bbsilog_qr_status(p_code uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE o bbsilog_private.web_orders; v bbsilog_private.review_vouchers;
BEGIN
 SELECT * INTO o FROM bbsilog_private.web_orders WHERE token=p_code;
 IF FOUND THEN
  IF o.status='completed' THEN RETURN jsonb_build_object('status','used','valid',false,'message','QR code has been used. This order is completed.'); END IF;
  IF o.status='cancelled' THEN RETURN jsonb_build_object('status','invalid','valid',false,'message','Invalid QR: '||coalesce(o.invalidated_reason,'Order cancelled')||'. Do not send or reuse the old QR.'); END IF;
  IF o.voucher IS NOT NULL THEN
   SELECT * INTO v FROM bbsilog_private.review_vouchers WHERE code=o.voucher;
   IF NOT FOUND OR v.used_at IS NOT NULL OR v.expires_at<=now() THEN RETURN jsonb_build_object('status','invalid','valid',false,'message','The voucher on this order was used or has expired. Revise and confirm the order again.'); END IF;
  END IF;
  RETURN jsonb_build_object('status','valid','valid',true,'message','Valid QR - awaiting staff confirmation. One use only. Going back to revise will invalidate this QR.');
 END IF;
 SELECT * INTO v FROM bbsilog_private.review_vouchers WHERE code=p_code;
 IF NOT FOUND THEN RETURN jsonb_build_object('status','invalid','valid',false,'message','Invalid BBSILOG QR code.'); END IF;
 IF v.used_at IS NOT NULL THEN RETURN jsonb_build_object('status','used','valid',false,'message','QR code has been used. This 5% voucher cannot be redeemed again.'); END IF;
 IF v.expires_at<=now() THEN RETURN jsonb_build_object('status','expired','valid',false,'message','This 5% voucher has expired.'); END IF;
 RETURN jsonb_build_object('status','valid','valid',true,'expires_at',v.expires_at,'message','Valid 5% voucher. One use, same mobile number. Replaces the website 3% discount.');
END $$;
REVOKE ALL ON FUNCTION public.bbsilog_cancel_order_qr(uuid),public.bbsilog_qr_status(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bbsilog_cancel_order_qr(uuid),public.bbsilog_qr_status(uuid) TO anon,authenticated;
NOTIFY pgrst,'reload schema';
