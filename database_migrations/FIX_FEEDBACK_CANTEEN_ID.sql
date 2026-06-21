-- =====================================================
-- FIX: Change feedback.canteen_id from UUID to TEXT
-- =====================================================

-- This matches your existing schema where:
-- canteens.id = TEXT
-- orders.canteen_id = TEXT
-- food_items.canteen_id = TEXT

-- Step 1: Drop the existing column (if it has constraints)
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_canteen_id_fkey;

-- Step 2: Change canteen_id from UUID to TEXT
ALTER TABLE feedback 
ALTER COLUMN canteen_id TYPE TEXT;

-- Step 3: Add foreign key constraint back
ALTER TABLE feedback
ADD CONSTRAINT feedback_canteen_id_fkey
FOREIGN KEY (canteen_id) REFERENCES canteens(id) ON DELETE CASCADE;

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'feedback' AND column_name = 'canteen_id';

-- Should show: canteen_id | text
