-- Deployment-order guard: the currently deployed application may still call this RPC.
-- Remove authenticated execute only in a post-deploy cleanup after the Razorpay branch is live and verified.
grant execute on function public.checkout_active_cart() to authenticated;
