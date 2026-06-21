-- Drop the review_likes table and related functions
DROP TABLE IF EXISTS review_likes;

-- Drop the functions for getting likes and dislikes count
DROP FUNCTION IF EXISTS get_review_likes_count;
DROP FUNCTION IF EXISTS get_review_dislikes_count;

-- Drop the function for toggling likes/dislikes
DROP FUNCTION IF EXISTS toggle_review_like;

-- Add edit_timestamp column to reviews table to track when reviews are edited
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS edit_timestamp timestamptz;