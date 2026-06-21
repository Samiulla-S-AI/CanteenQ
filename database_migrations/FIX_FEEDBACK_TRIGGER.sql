-- =====================================================
-- FIX: Feedback Notification Trigger - Ambiguous Column
-- =====================================================
-- Error: column reference "order_number" is ambiguous
-- Solution: Qualify all column references with table names

-- Drop the old trigger and function
DROP TRIGGER IF EXISTS feedback_submitted ON feedback;
DROP FUNCTION IF EXISTS create_feedback_notification();

-- Create the FIXED function with proper column qualification
CREATE OR REPLACE FUNCTION create_feedback_notification()
RETURNS TRIGGER AS $$
DECLARE
    canteen_name TEXT;
    order_number_val TEXT;
    user_name TEXT;
    admin_notification_email TEXT;
BEGIN
    -- Get canteen name with proper qualification
    SELECT c.name INTO canteen_name 
    FROM canteens c 
    WHERE c.id = NEW.canteen_id;
    
    -- Get order number with proper qualification
    SELECT o.order_number INTO order_number_val 
    FROM orders o 
    WHERE o.id = NEW.order_id;
    
    -- Get user name from email
    user_name := SPLIT_PART(NEW.user_email, '@', 1);
    
    -- Set admin email
    admin_notification_email := 'admin@canteenq.com';
    
    -- Create notification for admin
    INSERT INTO notifications (
        admin_email,
        user_email,
        is_admin_notification,
        title,
        message,
        type,
        feedback_data,
        order_id,
        read
    ) VALUES (
        admin_notification_email,
        admin_notification_email,
        TRUE,
        '⭐ New Feedback Received',
        format('Feedback for order #%s from %s', order_number_val, user_name),
        'info',
        jsonb_build_object(
            'rating', NEW.rating,
            'comment', COALESCE(NEW.comment, ''),
            'userName', user_name,
            'canteenName', COALESCE(canteen_name, 'Unknown'),
            'orderNumber', order_number_val,
            'canteenId', NEW.canteen_id::text
        ),
        NEW.order_id,
        FALSE
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER feedback_submitted
    AFTER INSERT ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION create_feedback_notification();

-- Test query to verify (optional)
-- SELECT * FROM information_schema.triggers WHERE trigger_name = 'feedback_submitted';
