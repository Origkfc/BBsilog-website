CREATE TABLE bbsilog_private.order_catalog(name text PRIMARY KEY, price numeric(12,2) CHECK(price>=0));
CREATE TABLE bbsilog_private.web_orders(
 token uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text UNIQUE NOT NULL DEFAULT ('BB-'||upper(substr(gen_random_uuid()::text,1,8))),
 request_id uuid UNIQUE NOT NULL, request_body jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 customer_name text NOT NULL, phone text NOT NULL, fulfillment text NOT NULL, payment text NOT NULL,
 address text NOT NULL DEFAULT '', notes text NOT NULL DEFAULT '', items jsonb NOT NULL,
 subtotal numeric(12,2) NOT NULL, unpriced boolean NOT NULL DEFAULT false, discount_rate int NOT NULL CHECK(discount_rate IN(3,5)),
 voucher uuid, status text NOT NULL DEFAULT 'pending' CHECK(status IN('pending','completed','cancelled')),
 completed_at timestamptz, final_food numeric(12,2), delivery_fee numeric(12,2), discount_amount numeric(12,2), final_total numeric(12,2),
 review_id bigint UNIQUE REFERENCES public.bbsilog_feedback(id), reward uuid
);
CREATE TABLE bbsilog_private.review_vouchers(
 code uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_token uuid UNIQUE NOT NULL REFERENCES bbsilog_private.web_orders(token),
 phone text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL DEFAULT(now()+interval '30 days'),
 used_at timestamptz, used_by uuid REFERENCES bbsilog_private.web_orders(token)
);
ALTER TABLE bbsilog_private.order_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE bbsilog_private.web_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bbsilog_private.review_vouchers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON bbsilog_private.order_catalog,bbsilog_private.web_orders,bbsilog_private.review_vouchers FROM anon,authenticated;
INSERT INTO bbsilog_private.order_catalog(name,price) VALUES
('Mixsilog',120),
('Crispy Lechon Silog',120),
('Spicy Chicken Silog',110),
('BBâ€™s Special Spaghetti',75),
('2 pc Burger Steak',90),
('Boneless Daing Silog',140),
('Special Chicken Silog',140),
('Chicken Adobo Silog',110),
('Crispy Chichabu Platter',140),
('Sizzling Pork Sisig',100),
('Sisig Platter',130),
('Marinated Porksilog',100),
('Breaded Porksilog',100),
('Tapa Silog',120),
('BBQ Liempo Silog',110),
('Bacsilog',100),
('Spam Silog',95),
('Supreme Burger Steak',130),
('Sizzling Chicken',NULL),
('Sizzling Porkchop',NULL),
('Sizzling Liempo',NULL),
('Mango Graham Smoothie',NULL),
('Choco Fudge Smoothie',NULL),
('Creamy Avocado Smoothie',NULL),
('Creamy Melon Smoothie',NULL),
('Extra rice',NULL),
('Extra egg',NULL);
CREATE FUNCTION public.bbsilog_create_order(p_request jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE o bbsilog_private.web_orders; v bbsilog_private.review_vouchers; c bbsilog_private.order_catalog; i jsonb; q int; total numeric:=0; unknown boolean:=false; canon jsonb:='[]'; ph text; kind text; pay text; nm text; rid uuid;
BEGIN
 IF jsonb_typeof(p_request)<>'object' THEN RAISE EXCEPTION 'Invalid order'; END IF;
 rid:=(p_request->>'request_id')::uuid;
 PERFORM pg_advisory_xact_lock(hashtextextended(rid::text,0));
 SELECT * INTO o FROM bbsilog_private.web_orders WHERE request_id=rid;
 IF FOUND THEN
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
 INSERT INTO bbsilog_private.web_orders(request_id,request_body,customer_name,phone,fulfillment,payment,address,notes,items,subtotal,unpriced,discount_rate,voucher)
 VALUES(rid,p_request,nm,ph,kind,pay,coalesce(p_request->>'address',''),coalesce(p_request->>'notes',''),canon,total,unknown,CASE WHEN v.code IS NULL THEN 3 ELSE 5 END,v.code) RETURNING * INTO o;
 RETURN jsonb_build_object('token',o.token,'code',o.code,'subtotal',o.subtotal,'unpriced',o.unpriced,'discount_rate',o.discount_rate);
END $$;
CREATE FUNCTION public.bbsilog_order_receipt(p_token uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE o bbsilog_private.web_orders;
BEGIN
 SELECT * INTO o FROM bbsilog_private.web_orders WHERE token=p_token;
 IF NOT FOUND THEN RAISE EXCEPTION 'Invalid order QR'; END IF;
 RETURN to_jsonb(o)-'request_body'-'request_id'-'voucher';
END $$;
CREATE FUNCTION public.bbsilog_submit_order_review(p_token uuid,p_review jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE o bbsilog_private.web_orders; feedback_id bigint; v bbsilog_private.review_vouchers; photo text;
BEGIN
 SELECT * INTO o FROM bbsilog_private.web_orders WHERE token=p_token FOR UPDATE;
 IF NOT FOUND OR o.status<>'completed' THEN RAISE EXCEPTION 'Review reward unlocks after staff completes your paid order'; END IF;
 IF o.review_id IS NOT NULL THEN RAISE EXCEPTION 'This order already received its review reward'; END IF;
 IF (p_review->>'rating')::int NOT BETWEEN 1 AND 5 OR p_review->>'rating' IS NULL OR length(trim(coalesce(p_review->>'message',''))) NOT BETWEEN 1 AND 1500 THEN RAISE EXCEPTION 'Choose a rating and write a review'; END IF;
 photo:=nullif(p_review->>'photo_path','');
 IF photo IS NOT NULL AND (photo !~ '^incoming/[0-9a-f-]{36}[.]webp$' OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='bbsilog-feedback-photos' AND name=photo)) THEN RAISE EXCEPTION 'Photo unavailable. Choose it again.'; END IF;
 INSERT INTO public.bbsilog_feedback(customer_name,rating,message,publish_consent,photo_path,photo_layout,photo_consent)
 VALUES(left(coalesce(nullif(trim(p_review->>'customer_name'),''),o.customer_name),80),(p_review->>'rating')::smallint,trim(p_review->>'message'),coalesce((p_review->>'publish_consent')::boolean,false),photo,CASE WHEN photo IS NOT NULL THEN p_review->>'photo_layout' END,photo IS NOT NULL AND coalesce((p_review->>'photo_consent')::boolean,false)) RETURNING id INTO feedback_id;
 INSERT INTO bbsilog_private.review_vouchers(order_token,phone) VALUES(o.token,o.phone) RETURNING * INTO v;
 UPDATE bbsilog_private.web_orders SET review_id=feedback_id,reward=v.code WHERE token=o.token;
 RETURN jsonb_build_object('voucher',v.code,'discount_rate',5,'expires_at',v.expires_at);
END $$;
CREATE FUNCTION public.bbsilog_admin_qr(p_code text,p_action text DEFAULT 'verify',p_unpriced_total numeric DEFAULT 0,p_delivery_fee numeric DEFAULT 0)
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
 IF o.status='cancelled' THEN RAISE EXCEPTION 'Order QR has been cancelled'; END IF;
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
CREATE FUNCTION public.bbsilog_admin_orders(p_view text DEFAULT 'pending') RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT public.bbsilog_is_feedback_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
 RETURN jsonb_build_object('counts',(SELECT jsonb_build_object('three',count(*) FILTER(WHERE status='completed' AND discount_rate=3),'five',count(*) FILTER(WHERE status='completed' AND discount_rate=5),'savings',coalesce(sum(discount_amount) FILTER(WHERE status='completed'),0),'pending',count(*) FILTER(WHERE status='pending')) FROM bbsilog_private.web_orders),
 'orders',(SELECT coalesce(jsonb_agg(to_jsonb(x)-'request_body'-'request_id'),'[]') FROM (SELECT * FROM bbsilog_private.web_orders WHERE CASE WHEN p_view='archives' THEN status<>'pending' ELSE status='pending' END ORDER BY created_at DESC LIMIT 200) x));
END $$;
REVOKE ALL ON FUNCTION public.bbsilog_create_order(jsonb),public.bbsilog_order_receipt(uuid),public.bbsilog_submit_order_review(uuid,jsonb),public.bbsilog_admin_qr(text,text,numeric,numeric),public.bbsilog_admin_orders(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bbsilog_create_order(jsonb),public.bbsilog_order_receipt(uuid),public.bbsilog_submit_order_review(uuid,jsonb) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bbsilog_admin_qr(text,text,numeric,numeric),public.bbsilog_admin_orders(text) TO authenticated;
NOTIFY pgrst,'reload schema';
