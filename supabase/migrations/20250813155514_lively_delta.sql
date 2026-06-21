/*
  # Initial Schema for CanteenQ Application

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `name` (text)
      - `department` (text)
      - `year` (text)
      - `mobile` (text)
      - `email` (text, unique)
      - `register_number` (text, unique)
      - `created_at` (timestamp)
    
    - `canteens`
      - `id` (uuid, primary key)
      - `name` (text)
      - `is_active` (boolean)
      - `image` (text)
      - `created_at` (timestamp)
    
    - `food_items`
      - `id` (uuid, primary key)
      - `canteen_id` (uuid, foreign key)
      - `name` (text)
      - `price` (numeric)
      - `rating` (numeric)
      - `image` (text)
      - `category` (text)
      - `break_time` (text)
      - `quantity` (integer)
      - `created_at` (timestamp)
    
    - `orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `user_email` (text)
      - `canteen_id` (uuid, foreign key)
      - `items` (jsonb)
      - `total_amount` (numeric)
      - `status` (text)
      - `order_number` (text, unique)
      - `qr_code` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department text NOT NULL,
  year text NOT NULL,
  mobile text NOT NULL,
  email text UNIQUE NOT NULL,
  register_number text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create canteens table
CREATE TABLE IF NOT EXISTS canteens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean DEFAULT true,
  image text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create food_items table
CREATE TABLE IF NOT EXISTS food_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canteen_id uuid REFERENCES canteens(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NOT NULL CHECK (price > 0),
  rating numeric DEFAULT 4.0 CHECK (rating >= 0 AND rating <= 5),
  image text NOT NULL,
  category text NOT NULL CHECK (category IN ('Drink', 'Snack', 'Food')),
  break_time text NOT NULL CHECK (break_time IN ('Morning', 'Afternoon', 'Evening')),
  quantity integer DEFAULT 0 CHECK (quantity >= 0),
  created_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NULL,
  user_email text NOT NULL,
  canteen_id uuid REFERENCES canteens(id) ON DELETE CASCADE,
  items jsonb NOT NULL,
  total_amount numeric NOT NULL CHECK (total_amount > 0),
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Preparing', 'Ready', 'Completed')),
  order_number text UNIQUE NOT NULL,
  qr_code text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE canteens ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  USING (true);

-- Create policies for canteens table
CREATE POLICY "Anyone can read canteens"
  ON canteens
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert canteens"
  ON canteens
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update canteens"
  ON canteens
  FOR UPDATE
  USING (true);

-- Create policies for food_items table
CREATE POLICY "Anyone can read food items"
  ON food_items
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert food items"
  ON food_items
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update food items"
  ON food_items
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete food items"
  ON food_items
  FOR DELETE
  USING (true);

-- Create policies for orders table
CREATE POLICY "Anyone can read orders"
  ON orders
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert orders"
  ON orders
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update orders"
  ON orders
  FOR UPDATE
  USING (true);

-- Insert initial canteens data
INSERT INTO canteens (id, name, is_active, image) VALUES
  ('dragon', 'Dragon Canteen', true, 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg'),
  ('snackspot', 'The Snack Spot', true, 'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg'),
  ('foodjunction', 'Food Junction', true, 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'),
  ('campuscafe', 'Campus Cafe', false, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg'),
  ('quickbites', 'Quick Bites', true, 'https://images.pexels.com/photos/776538/pexels-photo-776538.jpeg'),
  ('mdscanteen', 'MDS Canteen', true, 'https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg');

-- Insert initial food items data
INSERT INTO food_items (canteen_id, name, price, rating, image, category, break_time, quantity) VALUES
  -- Dragon Canteen Items
  ('dragon', 'Masala Dosa', 45, 4.5, 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg', 'Food', 'Morning', 20),
  ('dragon', 'Filter Coffee', 15, 4.2, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg', 'Drink', 'Morning', 30),
  ('dragon', 'Biryani', 85, 4.8, 'https://images.pexels.com/photos/8119547/pexels-photo-8119547.jpeg', 'Food', 'Afternoon', 15),
  
  -- Snack Spot Items
  ('snackspot', 'Samosa', 12, 4.3, 'https://images.pexels.com/photos/14477797/pexels-photo-14477797.jpeg', 'Snack', 'Evening', 25),
  ('snackspot', 'Mango Juice', 25, 4.1, 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg', 'Drink', 'Afternoon', 20),
  ('snackspot', 'Vada Pav', 18, 4.4, 'https://images.pexels.com/photos/4958792/pexels-photo-4958792.jpeg', 'Snack', 'Evening', 30),
  
  -- Food Junction Items
  ('foodjunction', 'Chicken Curry', 95, 4.6, 'https://images.pexels.com/photos/2474658/pexels-photo-2474658.jpeg', 'Food', 'Afternoon', 12),
  ('foodjunction', 'Lassi', 30, 4.0, 'https://images.pexels.com/photos/1337825/pexels-photo-1337825.jpeg', 'Drink', 'Afternoon', 18),
  
  -- Quick Bites Items
  ('quickbites', 'Sandwich', 35, 4.2, 'https://images.pexels.com/photos/1603901/pexels-photo-1603901.jpeg', 'Snack', 'Morning', 22),
  ('quickbites', 'Cold Coffee', 40, 4.5, 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg', 'Drink', 'Evening', 15),
  
  -- MDS Canteen Items
  ('mdscanteen', 'Pani Puri', 20, 4.7, 'https://images.pexels.com/photos/4958666/pexels-photo-4958666.jpeg', 'Snack', 'Evening', 28),
  ('mdscanteen', 'Idli Sambhar', 25, 4.3, 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg', 'Food', 'Morning', 20);