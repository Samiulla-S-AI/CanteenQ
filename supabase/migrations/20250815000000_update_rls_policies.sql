-- Update RLS policies for users table to allow anonymous access for inserting data

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;

-- Create new policy that allows anonymous access for inserting data
CREATE POLICY "Anyone can insert user data" 
  ON public.users
  FOR INSERT
  WITH CHECK (true);

-- Keep existing policies for select and update
-- These policies will still require authentication for reading and updating user data