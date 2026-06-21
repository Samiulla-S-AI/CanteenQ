-- Add cart_history table to store user cart history

-- Create cart_history table
CREATE TABLE IF NOT EXISTS public.cart_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NULL,
    user_email TEXT NOT NULL,
    items JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    is_converted_to_order BOOLEAN DEFAULT false,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.cart_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cart_history table
CREATE POLICY "Users can read own cart history" ON public.cart_history
    FOR SELECT USING (user_email = (auth.jwt() ->> 'email'));

CREATE POLICY "Users can insert own cart history" ON public.cart_history
    FOR INSERT WITH CHECK (user_email = (auth.jwt() ->> 'email'));

CREATE POLICY "Users can update own cart history" ON public.cart_history
    FOR UPDATE USING (user_email = (auth.jwt() ->> 'email'));

CREATE POLICY "Users can delete own cart history" ON public.cart_history
    FOR DELETE USING (user_email = (auth.jwt() ->> 'email'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cart_history_user_id ON public.cart_history(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_history_user_email ON public.cart_history(user_email);
CREATE INDEX IF NOT EXISTS idx_cart_history_created_at ON public.cart_history(created_at);
CREATE INDEX IF NOT EXISTS idx_cart_history_order_id ON public.cart_history(order_id);