-- Migration to update Razorpay payment structure and review system

-- 1. Remove review likes/dislikes functionality

-- Drop the review_likes table
DROP TABLE IF EXISTS public.review_likes;

-- Drop the functions related to review likes/dislikes
DROP FUNCTION IF EXISTS public.get_review_likes_count;
DROP FUNCTION IF EXISTS public.get_review_dislikes_count;
DROP FUNCTION IF EXISTS public.toggle_review_like;

-- 2. Add edit_timestamp column to reviews table
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS edit_timestamp TIMESTAMPTZ;

-- 3. Update RLS policies for reviews to allow users to edit/delete their own reviews
-- Note: This assumes the existing RLS policies are already set up correctly
-- If not, you may need to drop and recreate them

-- Verify existing policies
DO $$
BEGIN
  -- Check if the policies exist and recreate them if needed
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Enable read access for all users') THEN
    CREATE POLICY "Enable read access for all users" ON public.reviews
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Enable insert for authenticated users only') THEN
    CREATE POLICY "Enable insert for authenticated users only" ON public.reviews
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Enable update for users based on user_id') THEN
    CREATE POLICY "Enable update for users based on user_id" ON public.reviews
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Enable delete for users based on user_id') THEN
    CREATE POLICY "Enable delete for users based on user_id" ON public.reviews
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$$;

-- 4. Create a function to update average rating when a review is edited or deleted
CREATE OR REPLACE FUNCTION public.update_food_item_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the rating for the food item
  UPDATE public.food_items
  SET rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM public.reviews
    WHERE food_item_id = CASE
      WHEN TG_OP = 'DELETE' THEN OLD.food_item_id
      ELSE NEW.food_item_id
    END
  )
  WHERE id = CASE
    WHEN TG_OP = 'DELETE' THEN OLD.food_item_id
    ELSE NEW.food_item_id
  END;
  
  RETURN CASE
    WHEN TG_OP = 'DELETE' THEN OLD
    ELSE NEW
  END;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for the update_food_item_rating function
DROP TRIGGER IF EXISTS update_food_item_rating_on_review_change ON public.reviews;
CREATE TRIGGER update_food_item_rating_on_review_change
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_food_item_rating();