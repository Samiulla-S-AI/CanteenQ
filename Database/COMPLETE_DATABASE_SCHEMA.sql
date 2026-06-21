-- ================================================
-- CANTEENQ ACTUAL DATABASE SCHEMA
-- Version: 2.0 (Matches Current Production DB)
-- Last Updated: December 15, 2024
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1. USERS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    year TEXT NOT NULL,
    mobile TEXT NOT NULL,
    email TEXT NOT NULL,
    register_number TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_register_number ON users(register_number);

-- ================================================
-- 2. CANTEENS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS canteens (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    image TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canteens_active ON canteens(is_active);

-- ================================================
-- 3. ADMINS TABLE (WITH PASSWORD HASH & BANK DETAILS)
-- ================================================

CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    canteen_id TEXT REFERENCES canteens(id) ON DELETE CASCADE,
    is_master_admin BOOLEAN DEFAULT false,
    account_number TEXT,
    ifsc_code TEXT,
    pan_number TEXT,
    bank_name TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT admin_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_canteen ON admins(canteen_id);
CREATE INDEX IF NOT EXISTS idx_admins_master ON admins(is_master_admin) WHERE is_master_admin = true;

-- ================================================
-- 4. FOOD ITEMS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS food_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    rating NUMERIC(2, 1) DEFAULT 4.0,
    image TEXT NOT NULL,
    category TEXT NOT NULL,
    break_time TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    all_time_available BOOLEAN DEFAULT false,
    canteen_id TEXT REFERENCES canteens(id) ON DELETE CASCADE,
    
    CONSTRAINT valid_category CHECK (category IN ('Food', 'Drink', 'Snack')),
    CONSTRAINT valid_break_time CHECK (break_time IN ('Morning', 'Afternoon', 'Evening'))
);

CREATE INDEX IF NOT EXISTS idx_food_items_canteen ON food_items(canteen_id);
CREATE INDEX IF NOT EXISTS idx_food_items_category ON food_items(category);
CREATE INDEX IF NOT EXISTS idx_food_items_active ON food_items(is_active);
CREATE INDEX IF NOT EXISTS idx_food_items_break ON food_items(break_time);

-- ================================================
-- 5. ORDERS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    user_email TEXT NOT NULL,
    items JSONB NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Ready', 'Completed', 'Cancelled')),
    order_number TEXT UNIQUE NOT NULL,
    qr_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    canteen_id TEXT REFERENCES canteens(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_orders_user_email ON orders(user_email);
CREATE INDEX IF NOT EXISTS idx_orders_canteen ON orders(canteen_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- ================================================
-- 6. CART HISTORY TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS cart_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_email TEXT NOT NULL,
    items JSONB NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    is_converted_to_order BOOLEAN DEFAULT false,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cart_history_user_email ON cart_history(user_email);
CREATE INDEX IF NOT EXISTS idx_cart_history_order ON cart_history(order_id);

-- ================================================
-- 7. NOTIFICATIONS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT NOT NULL,
    user_id TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    items JSONB,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    admin_email TEXT,
    is_admin_notification BOOLEAN DEFAULT false,
    feedback_data JSONB
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_email ON notifications(user_email);
CREATE INDEX IF NOT EXISTS idx_notifications_admin_email ON notifications(admin_email) WHERE is_admin_notification = true;
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ================================================
-- 8. FEEDBACK TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_id TEXT,
    canteen_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_order ON feedback(order_id);
CREATE INDEX IF NOT EXISTS idx_feedback_canteen ON feedback(canteen_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback(user_email);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- ================================================
-- 9. REVIEWS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_item_id UUID REFERENCES food_items(id) ON DELETE CASCADE,
    user_id UUID,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    rating NUMERIC NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    edit_timestamp TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_reviews_food_item ON reviews(food_item_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_email ON reviews(user_email);

-- ================================================
-- 10. PAYMENT SETTINGS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS payment_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_name TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    bank_name TEXT,
    upi_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 11. PAYMENT TRANSACTIONS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    transaction_id TEXT UNIQUE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    platform_fee NUMERIC(10, 2) NOT NULL,
    master_admin_share NUMERIC(10, 2) NOT NULL,
    canteen_share NUMERIC(10, 2) NOT NULL,
    payment_status TEXT DEFAULT 'Initiated',
    payment_method TEXT NOT NULL,
    master_admin_account_number TEXT,
    master_admin_ifsc_code TEXT,
    master_admin_pan_card TEXT,
    canteen_account_number TEXT,
    canteen_ifsc_code TEXT,
    canteen_pan_card TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);

-- ================================================
-- 12. UPI PAYMENTS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS upi_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_ref TEXT UNIQUE NOT NULL,
    transaction_id TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    order_id TEXT,
    status TEXT DEFAULT 'pending',
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_upi_payments_transaction_ref ON upi_payments(transaction_ref);
CREATE INDEX IF NOT EXISTS idx_upi_payments_status ON upi_payments(status);

-- ================================================
-- 13. USER SESSIONS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    pending_payment JSONB,
    payment_success JSONB,
    session_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

-- ================================================
-- 14. CANTEEN MONTHLY METRICS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS canteen_monthly_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canteen_id UUID NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    month_start_date DATE NOT NULL,
    month_end_date DATE NOT NULL,
    total_revenue NUMERIC(10, 2) DEFAULT 0.00,
    revenue_change_amount NUMERIC(10, 2) DEFAULT 0.00,
    revenue_change_percent NUMERIC(5, 2) DEFAULT 0.00,
    total_orders INTEGER DEFAULT 0,
    completed_orders INTEGER DEFAULT 0,
    pending_orders INTEGER DEFAULT 0,
    ready_orders INTEGER DEFAULT 0,
    order_change_count INTEGER DEFAULT 0,
    order_change_percent NUMERIC(5, 2) DEFAULT 0.00,
    revenue_percentile NUMERIC(5, 2) DEFAULT 0.00,
    order_percentile NUMERIC(5, 2) DEFAULT 0.00,
    is_revenue_peak BOOLEAN DEFAULT false,
    is_order_peak BOOLEAN DEFAULT false,
    commission_rate NUMERIC(5, 2) DEFAULT 10.00,
    commission_revenue NUMERIC(10, 2) DEFAULT 0.00,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_canteen_monthly_metrics_canteen ON canteen_monthly_metrics(canteen_id);
CREATE INDEX IF NOT EXISTS idx_canteen_monthly_metrics_date ON canteen_monthly_metrics(year, month);

-- ================================================
-- 15. MASTER ADMIN MONTHLY METRICS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS master_admin_monthly_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    month_start_date DATE NOT NULL,
    month_end_date DATE NOT NULL,
    total_canteens INTEGER DEFAULT 0,
    total_commission_revenue NUMERIC(12, 2) DEFAULT 0.00,
    total_gross_revenue NUMERIC(12, 2) DEFAULT 0.00,
    commission_change_percent NUMERIC(5, 2) DEFAULT 0.00,
    total_orders INTEGER DEFAULT 0,
    total_completed_orders INTEGER DEFAULT 0,
    order_change_percent NUMERIC(5, 2) DEFAULT 0.00,
    revenue_percentile NUMERIC(5, 2) DEFAULT 0.00,
    order_percentile NUMERIC(5, 2) DEFAULT 0.00,
    is_revenue_peak BOOLEAN DEFAULT false,
    is_order_peak BOOLEAN DEFAULT false,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_master_admin_monthly_metrics_date ON master_admin_monthly_metrics(year, month);

-- ================================================
-- SAMPLE DATA - LOGIN CREDENTIALS
-- ================================================

-- Insert sample canteens
INSERT INTO canteens (id, name, image, is_active)
VALUES 
    ('dragon', 'Dragon Canteen', NULL, true),
    ('canteenq', 'CanteenQ Main', NULL, true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample admins (IMPORTANT: Use bcrypt for password_hash in production)
-- Note: These are example hashes - replace with actual bcrypt hashes
INSERT INTO admins (email, password_hash, canteen_id, is_master_admin, is_active)
VALUES 
    ('admin@canteenq.com', '$2a$10$examplehash123', NULL, true, true),
    ('dragoncanteen@gmail.com', '$2a$10$examplehash456', 'dragon', false, true)
ON CONFLICT (email) DO NOTHING;

-- ================================================
-- IMPORTANT NOTES
-- ================================================

/*
1. PASSWORD HASHING:
   - NEVER store plain text passwords
   - Use bcrypt with 10-12 rounds
   - Generate hash server-side before insert
   
   Example (Node.js):
   const bcrypt = require('bcrypt');
   const hash = await bcrypt.hash(password, 10);

2. COMMISSION RATE:
   - Currently set at 10% in canteen_monthly_metrics
   - Update to 4.8% if needed:
   UPDATE canteen_monthly_metrics SET commission_rate = 4.8;

3. CANTEEN_ID TYPE MISMATCH:
   - canteens.id = TEXT
   - But feedback.canteen_id = UUID
   - This needs to be fixed for consistency

4. FOOD_ITEMS.ID:
   - Changed from TEXT to UUID
   - Update application code if needed

5. BANK DETAILS:
   - Stored in admins table
   - Required for payment settlements
   - Ensure PAN validation

6. METRICS TABLES:
   - May not be populated if using real-time calculation
   - Consider dropping if unused
*/

-- ================================================
-- END OF SCHEMA
-- ================================================
