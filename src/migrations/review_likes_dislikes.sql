-- Add user_name column to reviews table if it doesn't exist
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_name TEXT;

-- Create review_likes table to track likes and dislikes
CREATE TABLE IF NOT EXISTS review_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  is_like BOOLEAN NOT NULL, -- true for like, false for dislike
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(review_id, user_id) -- Each user can only like or dislike a review once
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_review_likes_review_id ON review_likes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_likes_user_id ON review_likes(user_id);

-- Add functions to get likes and dislikes count
CREATE OR REPLACE FUNCTION get_review_likes_count(review_id UUID) 
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM review_likes WHERE review_id = $1 AND is_like = TRUE);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_review_dislikes_count(review_id UUID) 
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM review_likes WHERE review_id = $1 AND is_like = FALSE);
END;
$$ LANGUAGE plpgsql;

-- Function to toggle like/dislike
CREATE OR REPLACE FUNCTION toggle_review_like(
  p_review_id UUID,
  p_user_id TEXT,
  p_is_like BOOLEAN
) RETURNS BOOLEAN AS $$
DECLARE
  existing_record RECORD;
BEGIN
  -- Check if user already liked/disliked this review
  SELECT * INTO existing_record FROM review_likes 
  WHERE review_id = p_review_id AND user_id = p_user_id;
  
  IF existing_record IS NULL THEN
    -- No existing record, insert new one
    INSERT INTO review_likes (review_id, user_id, is_like)
    VALUES (p_review_id, p_user_id, p_is_like);
    RETURN TRUE;
  ELSIF existing_record.is_like = p_is_like THEN
    -- User is toggling off their like/dislike
    DELETE FROM review_likes 
    WHERE review_id = p_review_id AND user_id = p_user_id;
    RETURN FALSE;
  ELSE
    -- User is changing from like to dislike or vice versa
    UPDATE review_likes 
    SET is_like = p_is_like
    WHERE review_id = p_review_id AND user_id = p_user_id;
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql;