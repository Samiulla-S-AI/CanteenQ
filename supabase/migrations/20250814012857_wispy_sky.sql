-- CanteenQ Database Setup - Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    year TEXT NOT NULL,
    mobile TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    register_number TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create canteens table
CREATE TABLE IF NOT EXISTS public.canteens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    image TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create food_items table
CREATE TABLE IF NOT EXISTS public.food_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canteen_id UUID REFERENCES public.canteens(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    rating DECIMAL(2,1) DEFAULT 4.0,
    image TEXT NOT NULL,
    category TEXT CHECK (category IN ('Drink', 'Snack', 'Food')) NOT NULL,
    break_time TEXT CHECK (break_time IN ('Morning', 'Afternoon', 'Evening')) NOT NULL,
    quantity INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    canteen_id UUID REFERENCES public.canteens(id) ON DELETE CASCADE,
    items JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT CHECK (status IN ('Pending', 'Preparing', 'Ready', 'Completed')) DEFAULT 'Pending',
    order_number TEXT UNIQUE NOT NULL,
    qr_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canteens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can read own data" ON public.users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Create RLS policies for canteens table (public read access)
CREATE POLICY "Anyone can read canteens" ON public.canteens
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert canteens" ON public.canteens
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update canteens" ON public.canteens
    FOR UPDATE TO authenticated USING (true);

-- Create RLS policies for food_items table (public read access)
CREATE POLICY "Anyone can read food items" ON public.food_items
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert food items" ON public.food_items
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update food items" ON public.food_items
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete food items" ON public.food_items
    FOR DELETE TO authenticated USING (true);

-- Create RLS policies for orders table
CREATE POLICY "Users can read own orders" ON public.orders
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Authenticated users can read all orders" ON public.orders
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update orders" ON public.orders
    FOR UPDATE TO authenticated USING (true);

-- Insert sample canteens
INSERT INTO public.canteens (name, is_active, image) VALUES
('Dragon Canteen', true, 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'),
('The Snack Spot', true, 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg'),
('Food Junction', true, 'https://images.pexels.com/photos/1640773/pexels-photo-1640773.jpeg'),
('Campus Cafe', true, 'https://images.pexels.com/photos/1640775/pexels-photo-1640775.jpeg'),
('Quick Bites', true, 'https://images.pexels.com/photos/1640776/pexels-photo-1640776.jpeg'),
('MDS Canteen', true, 'https://images.pexels.com/photos/1640778/pexels-photo-1640778.jpeg')
ON CONFLICT DO NOTHING;

-- Insert sample food items for each canteen
DO $$
DECLARE
    dragon_id UUID;
    snack_spot_id UUID;
    food_junction_id UUID;
    campus_cafe_id UUID;
    quick_bites_id UUID;
    mds_id UUID;
BEGIN
    -- Get canteen IDs
    SELECT id INTO dragon_id FROM public.canteens WHERE name = 'Dragon Canteen';
    SELECT id INTO snack_spot_id FROM public.canteens WHERE name = 'The Snack Spot';
    SELECT id INTO food_junction_id FROM public.canteens WHERE name = 'Food Junction';
    SELECT id INTO campus_cafe_id FROM public.canteens WHERE name = 'Campus Cafe';
    SELECT id INTO quick_bites_id FROM public.canteens WHERE name = 'Quick Bites';
    SELECT id INTO mds_id FROM public.canteens WHERE name = 'MDS Canteen';

    -- Dragon Canteen items
    INSERT INTO public.food_items (canteen_id, name, price, rating, image, category, break_time, quantity) VALUES
    (dragon_id, 'Dragon Special Tea', 15.00, 4.5, 'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg', 'Drink', 'Morning', 50),
    (dragon_id, 'Spicy Samosa', 25.00, 4.2, 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg', 'Snack', 'Morning', 30),
    (dragon_id, 'Dragon Fried Rice', 80.00, 4.7, 'https://images.pexels.com/photos/1640771/pexels-photo-1640771.jpeg', 'Food', 'Afternoon', 20);

    -- The Snack Spot items
    INSERT INTO public.food_items (canteen_id, name, price, rating, image, category, break_time, quantity) VALUES
    (snack_spot_id, 'Fresh Juice', 30.00, 4.3, 'https://images.pexels.com/photos/1638281/pexels-photo-1638281.jpeg', 'Drink', 'Morning', 40),
    (snack_spot_id, 'Chocolate Cookies', 20.00, 4.1, 'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg', 'Snack', 'Afternoon', 25),
    (snack_spot_id, 'Veg Sandwich', 45.00, 4.4, 'https://images.pexels.com/photos/1640769/pexels-photo-1640769.jpeg', 'Food', 'Evening', 15);

    -- Food Junction items
    INSERT INTO public.food_items (canteen_id, name, price, rating, image, category, break_time, quantity) VALUES
    (food_junction_id, 'Cold Coffee', 35.00, 4.6, 'https://images.pexels.com/photos/1638282/pexels-photo-1638282.jpeg', 'Drink', 'Afternoon', 35),
    (food_junction_id, 'Masala Puff', 30.00, 4.0, 'https://images.pexels.com/photos/1640768/pexels-photo-1640768.jpeg', 'Snack', 'Morning', 20),
    (food_junction_id, 'Chicken Biryani', 120.00, 4.8, 'https://images.pexels.com/photos/1640767/pexels-photo-1640767.jpeg', 'Food', 'Afternoon', 10);

    -- Campus Cafe items
    INSERT INTO public.food_items (canteen_id, name, price, rating, image, category, break_time, quantity) VALUES
    (campus_cafe_id, 'Cappuccino', 40.00, 4.5, 'https://images.pexels.com/photos/1638283/pexels-photo-1638283.jpeg', 'Drink', 'Morning', 30),
    (campus_cafe_id, 'Cheese Burger', 65.00, 4.3, 'https://images.pexels.com/photos/1640766/pexels-photo-1640766.jpeg', 'Food', 'Evening', 12),
    (campus_cafe_id, 'French Fries', 35.00, 4.1, 'https://images.pexels.com/photos/1640765/pexels-photo-1640765.jpeg', 'Snack', 'Afternoon', 25);

    -- Quick Bites items
    INSERT INTO public.food_items (canteen_id, name, price, rating, image, category, break_time, quantity) VALUES
    (quick_bites_id, 'Lemon Soda', 20.00, 4.2, 'https://images.pexels.com/photos/1638284/pexels-photo-1638284.jpeg', 'Drink', 'Evening', 45),
    (quick_bites_id, 'Vada Pav', 25.00, 4.4, 'https://images.pexels.com/photos/1640764/pexels-photo-1640764.jpeg', 'Snack', 'Morning', 30),
    (quick_bites_id, 'Paneer Roll', 55.00, 4.6, 'https://images.pexels.com/photos/1640763/pexels-photo-1640763.jpeg', 'Food', 'Afternoon', 18);

    -- MDS Canteen items
    INSERT INTO public.food_items (canteen_id, name, price, rating, image, category, break_time, quantity) VALUES
    (mds_id, 'Masala Chai', 12.00, 4.7, 'https://images.pexels.com/photos/1638285/pexels-photo-1638285.jpeg', 'Drink', 'Morning', 60),
    (mds_id, 'Aloo Paratha', 40.00, 4.5, 'https://images.pexels.com/photos/1640762/pexels-photo-1640762.jpeg', 'Food', 'Morning', 15),
    (mds_id, 'Banana Chips', 18.00, 4.0, 'https://images.pexels.com/photos/1640761/pexels-photo-1640761.jpeg', 'Snack', 'Evening', 35);

END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_food_items_canteen_id ON public.food_items(canteen_id);
CREATE INDEX IF NOT EXISTS idx_food_items_category ON public.food_items(category);
CREATE INDEX IF NOT EXISTS idx_food_items_break_time ON public.food_items(break_time);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_canteen_id ON public.orders(canteen_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);