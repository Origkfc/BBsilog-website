-- Keep the admin's REST moderation actions aligned with the existing row-level security policy.
GRANT UPDATE (customer_name, status, archived_at)
ON TABLE public.bbsilog_feedback
TO authenticated;
