-- =====================================================
-- QUICK FIX: Feedback Read Status Not Persisting
-- =====================================================
-- Run this in Supabase SQL Editor NOW!

-- 1. Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable read access for all users" ON notifications;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON notifications;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON notifications;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON notifications;

-- 2. Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 3. Create proper policies for ADMIN notifications

-- Allow admins to READ their notifications
CREATE POLICY "Admins can read admin notifications" ON notifications
  FOR SELECT
  USING (is_admin_notification = true);

-- Allow admins to UPDATE their notifications (FIX FOR MARK AS READ!)
CREATE POLICY "Admins can update admin notifications" ON notifications
  FOR UPDATE
  USING (is_admin_notification = true)
  WITH CHECK (is_admin_notification = true);

-- Allow system to INSERT notifications
CREATE POLICY "System can insert all notifications" ON notifications
  FOR INSERT
  WITH CHECK (true);

-- Allow admins to DELETE their notifications
CREATE POLICY "Admins can delete admin notifications" ON notifications
  FOR DELETE
  USING (is_admin_notification = true);

-- 4. Test the fix
-- Try marking a notification as read (without LIMIT - PostgreSQL doesn't support it in UPDATE)
UPDATE notifications
SET read = true
WHERE id IN (
  SELECT id FROM notifications
  WHERE is_admin_notification = true
    AND read = false
  LIMIT 1
);

-- 5. Verify it worked
SELECT id, title, read, is_admin_notification
FROM notifications
WHERE is_admin_notification = true
ORDER BY created_at DESC
LIMIT 5;

-- You should see 'read' = true for the one you just updated!
