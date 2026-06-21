# 🔐 LOGIN CREDENTIALS - ACTUAL DATABASE SCHEMA

## ⚠️ IMPORTANT: YOUR DATABASE HAS PASSWORD HASHING!

Your database has a `password_hash` column in the `admins` table, which means passwords are stored as bcrypt hashes.

---

## 📋 ADMINS TABLE STRUCTURE (ACTUAL)

```sql
CREATE TABLE admins (
    id UUID,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,  ← BCRYPT HASH
    canteen_id TEXT,
    is_master_admin BOOLEAN,
    account_number TEXT,          ← Bank details
    ifsc_code TEXT,
    pan_number TEXT,
    bank_name TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    last_login_at TIMESTAMP
);
```

---

## 🔑 CURRENT ADMIN ACCOUNTS

Run this to see all admins:

```sql
SELECT 
    email,
    canteen_id,
    is_master_admin,
    is_active,
    account_number,
    bank_name
FROM admins
WHERE is_active = true;
```

---

## 🚨 PASSWORD SECURITY

### **1. Passwords are HASHED:**
```sql
-- Example bcrypt hash
password_hash: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
```

### **2. NEVER Store Plain Text:**
```javascript
// ❌ WRONG
INSERT INTO admins (email, password_hash) 
VALUES ('admin@example.com', '123456');

// ✅ CORRECT
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('123456', 10);
INSERT INTO admins (email, password_hash) 
VALUES ('admin@example.com', hash);
```

### **3. Password Verification:**
```javascript
const bcrypt = require('bcrypt');

// Get stored hash from database
const admin = await db.query('SELECT password_hash FROM admins WHERE email = $1', [email]);

// Compare entered password with hash
const isValid = await bcrypt.compare(enteredPassword, admin.password_hash);

if (isValid) {
  // Login successful
} else {
  // Invalid password
}
```

---

## 📝 ADD NEW ADMIN WITH PASSWORD

### **Method 1: Using Node.js (Recommended):**

```javascript
const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function addAdmin(email, password, canteenId, isMasterAdmin) {
  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Insert admin
  const { data, error } = await supabase
    .from('admins')
    .insert({
      email: email,
      password_hash: passwordHash,
      canteen_id: canteenId,
      is_master_admin: isMasterAdmin,
      is_active: true
    });
  
  if (error) throw error;
  return data;
}

// Usage:
await addAdmin('newadmin@example.com', 'securePassword123', 'dragon', false);
```

### **Method 2: Using SQL (Manual Hash):**

First, generate a bcrypt hash using an online tool or bcrypt library, then:

```sql
INSERT INTO admins (email, password_hash, canteen_id, is_master_admin, is_active)
VALUES (
  'newadmin@example.com',
  '$2a$10$yourBcryptHashHere',
  'dragon',
  false,
  true
);
```

---

## 🏦 BANK DETAILS FIELDS

Your admins table includes bank details for payment settlements:

```sql
-- Check admin bank details
SELECT 
    email,
    account_number,
    ifsc_code,
    pan_number,
    bank_name
FROM admins
WHERE email = 'admin@canteenq.com';
```

### **Update Bank Details:**

```sql
UPDATE admins 
SET 
    account_number = '1234567890',
    ifsc_code = 'SBIN0001234',
    pan_number = 'ABCDE1234F',
    bank_name = 'State Bank of India'
WHERE email = 'admin@canteenq.com';
```

---

## 🔐 ADMIN LOGIN FLOW (WITH PASSWORD)

1. **User enters email and password**
2. **System queries database:**
   ```sql
   SELECT id, email, password_hash, canteen_id, is_master_admin 
   FROM admins 
   WHERE email = $1 AND is_active = true;
   ```
3. **System verifies password:**
   ```javascript
   const isValid = await bcrypt.compare(enteredPassword, admin.password_hash);
   ```
4. **If valid:**
   - Update `last_login_at`
   - Create session
   - Redirect to dashboard

---

## 📊 VIEW ALL ADMINS (QUERY)

```sql
SELECT 
    email,
    canteen_id,
    is_master_admin,
    is_active,
    account_number,
    ifsc_code,
    bank_name,
    created_at,
    last_login_at
FROM admins
WHERE is_active = true
ORDER BY is_master_admin DESC, created_at DESC;
```

---

## 🔒 SECURITY BEST PRACTICES

### **1. Password Requirements:**
```javascript
// Minimum requirements
const passwordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true
};

function validatePassword(password) {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[!@#$%^&*]/.test(password)) return false;
  return true;
}
```

### **2. Bcrypt Rounds:**
```javascript
// Use 10-12 rounds (higher = more secure but slower)
const rounds = 10;
const hash = await bcrypt.hash(password, rounds);
```

### **3. Update Password:**
```sql
-- First hash the new password, then:
UPDATE admins 
SET password_hash = '$2a$10$newHashHere',
    updated_at = NOW()
WHERE email = 'admin@example.com';
```

---

## 🚀 SAMPLE ADMINS SETUP

### **Create Master Admin:**

```javascript
const bcrypt = require('bcrypt');

const masterAdmin = {
  email: 'admin@canteenq.com',
  password: 'YourSecurePassword123!',
  canteen_id: null,
  is_master_admin: true,
  account_number: '9876543210',
  ifsc_code: 'SBIN0001234',
  pan_number: 'ABCDE1234F',
  bank_name: 'State Bank of India'
};

const hash = await bcrypt.hash(masterAdmin.password, 10);

// Insert to database
await supabase.from('admins').insert({
  ...masterAdmin,
  password_hash: hash,
  password: undefined // Remove plain password
});
```

### **Create Canteen Admin:**

```javascript
const canteenAdmin = {
  email: 'dragoncanteen@gmail.com',
  password: 'DragonSecure456!',
  canteen_id: 'dragon',
  is_master_admin: false,
  account_number: '1234567890',
  ifsc_code: 'HDFC0001234',
  pan_number: 'FGHIJ5678K',
  bank_name: 'HDFC Bank'
};

const hash = await bcrypt.hash(canteenAdmin.password, 10);

await supabase.from('admins').insert({
  ...canteenAdmin,
  password_hash: hash,
  password: undefined
});
```

---

## 🔍 VERIFY LOGIN CREDENTIALS

### **Test Admin Login:**

```javascript
async function testLogin(email, password) {
  // 1. Get admin from database
  const { data: admin } = await supabase
    .from('admins')
    .select('*')
    .eq('email', email)
    .eq('is_active', true)
    .single();
  
  if (!admin) {
    console.log('❌ Admin not found');
    return false;
  }
  
  // 2. Verify password
  const isValid = await bcrypt.compare(password, admin.password_hash);
  
  if (isValid) {
    console.log('✅ Login successful');
    console.log('Admin:', admin.email);
    console.log('Role:', admin.is_master_admin ? 'Master Admin' : 'Canteen Admin');
    console.log('Canteen:', admin.canteen_id || 'All');
    return true;
  } else {
    console.log('❌ Invalid password');
    return false;
  }
}

// Test
await testLogin('admin@canteenq.com', 'YourPassword');
```

---

## 📧 FORGOT PASSWORD FLOW

### **1. Generate Reset Token:**

```javascript
const crypto = require('crypto');

async function generateResetToken(email) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000); // 1 hour
  
  // Store token in database (add reset_token and reset_expires columns)
  await supabase
    .from('admins')
    .update({
      reset_token: token,
      reset_expires: expires
    })
    .eq('email', email);
  
  // Send email with reset link
  const resetLink = `https://yourapp.com/reset-password?token=${token}`;
  // Send email...
  
  return token;
}
```

### **2. Reset Password:**

```javascript
async function resetPassword(token, newPassword) {
  // Verify token
  const { data: admin } = await supabase
    .from('admins')
    .select('*')
    .eq('reset_token', token)
    .gt('reset_expires', new Date())
    .single();
  
  if (!admin) {
    throw new Error('Invalid or expired token');
  }
  
  // Hash new password
  const hash = await bcrypt.hash(newPassword, 10);
  
  // Update password
  await supabase
    .from('admins')
    .update({
      password_hash: hash,
      reset_token: null,
      reset_expires: null,
      updated_at: new Date()
    })
    .eq('id', admin.id);
}
```

---

## ⚙️ ADMIN MANAGEMENT FUNCTIONS

### **Deactivate Admin:**

```sql
UPDATE admins 
SET is_active = false,
    updated_at = NOW()
WHERE email = 'admin@example.com';
```

### **Reactivate Admin:**

```sql
UPDATE admins 
SET is_active = true,
    updated_at = NOW()
WHERE email = 'admin@example.com';
```

### **Change Admin Canteen:**

```sql
UPDATE admins 
SET canteen_id = 'canteenq',
    updated_at = NOW()
WHERE email = 'admin@example.com';
```

### **Promote to Master Admin:**

```sql
UPDATE admins 
SET is_master_admin = true,
    canteen_id = NULL,
    updated_at = NOW()
WHERE email = 'admin@example.com';
```

---

## 📋 COMPLETE SETUP CHECKLIST

- [ ] Install bcrypt: `npm install bcrypt`
- [ ] Generate password hashes for all admins
- [ ] Insert admins with hashed passwords
- [ ] Add bank details for settlement
- [ ] Test login with correct password
- [ ] Test login with wrong password
- [ ] Verify `is_active` filtering works
- [ ] Set up password reset flow (optional)
- [ ] Document all admin credentials securely

---

## 🎯 SUMMARY

**Your Database Uses:**
- ✅ Bcrypt password hashing
- ✅ Bank details for payments
- ✅ Active/inactive status
- ✅ Last login tracking
- ✅ Master admin role

**To Add Admin:**
1. Hash password with bcrypt
2. Insert with bank details
3. Set `is_active = true`
4. Test login

**Never store plain text passwords!** 🔐✅
