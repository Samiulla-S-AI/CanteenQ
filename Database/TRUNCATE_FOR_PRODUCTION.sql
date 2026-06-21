-- ================================================
-- CANTEENQ - CLEAR ALL TEST DATA FOR PRODUCTION LAUNCH
-- ================================================
-- Run this in Supabase SQL Editor
-- WARNING: This will DELETE ALL DATA. Make sure you have backups if needed.
-- Date: 2026-03-25
-- ================================================

-- Disable triggers temporarily for faster execution
SET session_replication_role = 'replica';

-- ================================================
-- STEP 1: Clear child tables first (have foreign keys)
-- ================================================

-- Clear payment & transaction data
TRUNCATE TABLE payment_transactions CASCADE;
TRUNCATE TABLE upi_payments CASCADE;

-- Clear feedback & reviews
TRUNCATE TABLE feedback CASCADE;
TRUNCATE TABLE reviews CASCADE;

-- Clear notifications
TRUNCATE TABLE notifications CASCADE;

-- Clear cart history
TRUNCATE TABLE cart_history CASCADE;

-- Clear user sessions
TRUNCATE TABLE user_sessions CASCADE;

-- Clear metrics
TRUNCATE TABLE canteen_monthly_metrics CASCADE;
TRUNCATE TABLE master_admin_monthly_metrics CASCADE;

-- ================================================
-- STEP 2: Clear orders (referenced by many tables above)
-- ================================================

TRUNCATE TABLE orders CASCADE;

-- ================================================
-- STEP 3: Clear user data
-- ================================================

TRUNCATE TABLE users CASCADE;

-- ================================================
-- STEP 4: Clear payment settings
-- ================================================

TRUNCATE TABLE payment_settings CASCADE;

-- ================================================
-- STEP 5: KEEP OR CLEAR - Your choice
-- ================================================

-- UNCOMMENT the lines below ONLY if you also want to 
-- remove canteens, food items, and admin accounts.
-- Usually you KEEP these for production.

-- TRUNCATE TABLE food_items CASCADE;
-- TRUNCATE TABLE admins CASCADE;
-- TRUNCATE TABLE canteens CASCADE;

-- ================================================
-- Re-enable triggers
-- ================================================

SET session_replication_role = 'origin';

-- ================================================
-- VERIFY: Check all tables are empty
-- ================================================

SELECT 'orders' AS table_name, COUNT(*) AS row_count FROM orders
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'cart_history', COUNT(*) FROM cart_history
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL SELECT 'feedback', COUNT(*) FROM feedback
UNION ALL SELECT 'reviews', COUNT(*) FROM reviews
UNION ALL SELECT 'payment_transactions', COUNT(*) FROM payment_transactions
UNION ALL SELECT 'upi_payments', COUNT(*) FROM upi_payments
UNION ALL SELECT 'user_sessions', COUNT(*) FROM user_sessions
UNION ALL SELECT 'payment_settings', COUNT(*) FROM payment_settings
UNION ALL SELECT 'canteen_monthly_metrics', COUNT(*) FROM canteen_monthly_metrics
UNION ALL SELECT 'master_admin_monthly_metrics', COUNT(*) FROM master_admin_monthly_metrics
UNION ALL SELECT '--- KEPT ---', 0
UNION ALL SELECT 'canteens', COUNT(*) FROM canteens
UNION ALL SELECT 'food_items', COUNT(*) FROM food_items
UNION ALL SELECT 'admins', COUNT(*) FROM admins
ORDER BY table_name;
