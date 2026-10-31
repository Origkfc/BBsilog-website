ALTER TABLE bbsilog_private.web_orders DROP CONSTRAINT web_orders_discount_rate_check;
ALTER TABLE bbsilog_private.web_orders ADD CONSTRAINT web_orders_discount_rate_check CHECK(discount_rate IN(0,3,5));
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
 VALUES(checkout,rid,p_request,nm,ph,kind,pay,coalesce(p_request->>'address',''),coalesce(p_request->>'notes',''),canon,total,unknown,CASE WHEN v.code IS NULL THEN 0 ELSE 5 END,v.code) RETURNING * INTO o;
 RETURN jsonb_build_object('token',o.token,'code',o.code,'subtotal',o.subtotal,'unpriced',o.unpriced,'discount_rate',o.discount_rate);
END $$;
CREATE OR REPLACE FUNCTION public.bbsilog_qr_status(p_code uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
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
 RETURN jsonb_build_object('status','valid','valid',true,'expires_at',v.expires_at,'message','Valid 5% voucher. One use, same mobile number. Apply it to a future order.');
END $$;
CREATE OR REPLACE FUNCTION public.bbsilog_admin_orders(p_view text DEFAULT 'pending') RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT public.bbsilog_is_feedback_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
 RETURN jsonb_build_object('counts',(SELECT jsonb_build_object('none',count(*) FILTER(WHERE status='completed' AND discount_rate=0),'three',count(*) FILTER(WHERE status='completed' AND discount_rate=3),'five',count(*) FILTER(WHERE status='completed' AND discount_rate=5),'savings',coalesce(sum(discount_amount) FILTER(WHERE status='completed'),0),'pending',count(*) FILTER(WHERE status='pending')) FROM bbsilog_private.web_orders),
 'orders',(SELECT coalesce(jsonb_agg(to_jsonb(x)-'request_body'-'request_id'),'[]') FROM (SELECT * FROM bbsilog_private.web_orders WHERE CASE WHEN p_view='archives' THEN status<>'pending' ELSE status='pending' END ORDER BY created_at DESC LIMIT 200) x));
END $$;
NOTIFY pgrst,'reload schema';
