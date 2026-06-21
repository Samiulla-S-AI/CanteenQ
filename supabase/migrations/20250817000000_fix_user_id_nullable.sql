-- Migration to fix user_id field in cart_history and orders tables

-- Modify cart_history table to make user_id nullable
ALTER TABLE public.cart_history ALTER COLUMN user_id DROP NOT NULL;

-- Modify orders table to make user_id nullable
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

-- Update RLS policy for cart_history to handle null user_id
DROP POLICY IF EXISTS "Users can view their own cart history" ON public.cart_history;
CREATE POLICY "Users can view their own cart history"
    ON public.cart_history
    FOR SELECT
    USING ((user_id IS NULL) OR (auth.uid()::text = user_id::text) OR (auth.jwt()->>'email' = user_email));

-- Update RLS policy for orders to handle null user_id
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders"
    ON public.orders
    FOR SELECT
    USING ((user_id IS NULL) OR (auth.uid()::text = user_id::text) OR (auth.jwt()->>'email' = user_email));