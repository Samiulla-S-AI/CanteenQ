# 🗑️ DELETE ALL OUTDATED FILES - CLEANUP SCRIPT

## ⚠️ BEFORE RUNNING: BACKUP YOUR WORK!

```bash
# Create backup
mkdir ../CanteenQ_Backup_2024_12_15
cp -r . ../CanteenQ_Backup_2024_12_15/
```

---

## 📋 FILES TO DELETE (Run these commands)

### Delete ALL Markdown Documentation Files:

```bash
# Navigate to project root
cd c:\Users\samiu\OneDrive\Desktop\CanteenQ_Web_Production

# Delete all .md files EXCEPT README.md and the ones we keep
del /F /Q "405_ERROR_FIXED.md"
del /F /Q "ADMIN_DASHBOARD_FIXES.md"
del /F /Q "ADMIN_UPDATE_INSTEAD_OF_DUPLICATE.md"
del /F /Q "ANALYTICS_CHARTS_ENHANCEMENT.md"
del /F /Q "ANALYTICS_COMPLETE.md"
del /F /Q "ANALYTICS_FINAL_FIX.md"
del /F /Q "ANALYTICS_FIX_SUMMARY.md"
del /F /Q "ANALYTICS_IMPLEMENTATION_CHECKLIST.md"
del /F /Q "ANALYTICS_SCHEMA_GUIDE.md"
del /F /Q "ANALYTICS_SIMPLIFIED.md"
del /F /Q "ANALYTICS_SOLUTION_SUMMARY.md"
del /F /Q "ANALYTICS_USER_GUIDE.md"
del /F /Q "API_USAGE.md"
del /F /Q "ARCHITECTURE.md"
del /F /Q "AUTO_POPULATE_ANALYTICS_GUIDE.md"
del /F /Q "BAR_SIZING_FIX.md"
del /F /Q "BEFORE_AFTER_ANALYTICS.md"
del /F /Q "CANTEEN_ADMIN_ANALYTICS_FIXED.md"
del /F /Q "CANTEEN_FILTER_FIX.md"
del /F /Q "CARDS_PEAKHOURS_RESPONSIVE.md"
del /F /Q "COLUMN_NAME_FIX.md"
del /F /Q "COMMISSION_4.8_PERCENT_COMPLETE.md"
del /F /Q "COMMISSION_4_PERCENT_COMPLETE.md"
del /F /Q "COMMISSION_AND_ORDERS_UI_UPDATED.md"
del /F /Q "COMPLETE_MIGRATION_STEPS.md"
del /F /Q "CREDENTIALS_AND_FOOD_ITEMS_GUIDE.md"
del /F /Q "CURRENT_ISSUES.md"
del /F /Q "DATABASE_AUTHENTICATION_GUIDE.md"
del /F /Q "DATABASE_SCHEMA_UPDATE_GUIDE.md"
del /F /Q "database_connection.md"
del /F /Q "DEBUG_ANALYTICS.md"
del /F /Q "DEBUG_CANTEEN_ADMIN_DATA.md"
del /F /Q "DEPLOYMENT_CHECKLIST.md"
del /F /Q "DEPLOYMENT_FAQ.md"
del /F /Q "DEPLOY_WITH_CLI.md"
del /F /Q "DUMMY_DATA_REMOVAL_REPORT.md"
del /F /Q "ENHANCED_ANALYTICS_FEATURES.md"
del /F /Q "ENHANCEMENTS_SUMMARY.md"
del /F /Q "ERRORS_FIXED_SUMMARY.md"
del /F /Q "EXPORT_TOP_ITEMS_FIXED.md"
del /F /Q "FEEDBACK_IMPROVEMENTS.md"
del /F /Q "FEEDBACK_SYSTEM_GUIDE.md"
del /F /Q "FEEDBACK_SYSTEM_SUMMARY.md"
del /F /Q "FILES_TO_DELETE.md"
del /F /Q "FINAL_SOLUTION_LAST_3_MONTHS.md"
del /F /Q "FIXES_AND_NEXT_STEPS.md"
del /F /Q "FIXES_APPLIED.md"
del /F /Q "LINECHART_ERROR_FIXED.md"
del /F /Q "LINE_CHARTS_FIX_COMPLETE.md"
del /F /Q "LINE_CHARTS_GUIDE.md"
del /F /Q "LIVE_ANALYTICS_IMPLEMENTATION.md"
del /F /Q "MASTER_ADMIN_ANALYTICS_FIXED.md"
del /F /Q "MOBILE_ANALYTICS_COMPLETE.md"
del /F /Q "NOTIFICATIONS_SETUP_COMPLETE.md"
del /F /Q "NOTIFICATIONS_SUMMARY.md"
del /F /Q "ORDER_NOTIFICATIONS_SETUP.md"
del /F /Q "ORDERS_PAGE_IMPROVEMENTS.md"
del /F /Q "PAYMENT_GATEWAY_SETUP.md"
del /F /Q "PROJECT_STRUCTURE.md"
del /F /Q "QR_SCANNER_HELP.md"
del /F /Q "QUICK_START.md"
del /F /Q "REALTIME_SUBSCRIPTIONS_FIX.md"
del /F /Q "RESPONSIVE_DESIGN_GUIDE.md"
del /F /Q "RLS_FIX_APPLIED.md"
del /F /Q "ROUTE_PROTECTION.md"
del /F /Q "SECURITY_GUIDE.md"
del /F /Q "TESTING_GUIDE.md"
del /F /Q "TRIGGERS_GUIDE.md"
del /F /Q "USER_FLOW.md"
del /F /Q "WALKTHROUGH.md"
```

### Delete ALL Old SQL Migration Files:

```bash
cd database_migrations

del /F /Q "ABSOLUTE_FINAL_FIX.sql"
del /F /Q "analytics_metrics_schema.sql"
del /F /Q "CHECK_ACTUAL_TYPES.sql"
del /F /Q "CHECK_ORDERS_SCHEMA.sql"
del /F /Q "CHECK_TYPES.sql"
del /F /Q "check_orders_columns.sql"
del /F /Q "COMPLETE_ALL_TO_TEXT.sql"
del /F /Q "COMPLETE_MIGRATION_NO_TRIGGERS.sql"
del /F /Q "COMPLETE_TEXT_ID_MIGRATION.sql"
del /F /Q "COMPLETE_TEXT_ID_MIGRATION_FIXED.sql"
del /F /Q "COMPLETE_UUID_TO_TEXT_FIX.sql"
del /F /Q "create_admin_helper_functions.sql"
del /F /Q "create_admin_login_function.sql"
del /F /Q "create_admins_table.sql"
del /F /Q "diagnose_no_data.sql"
del /F /Q "final_fix_with_cap.sql"
del /F /Q "FINAL_MIGRATION_FUNCTION_FIRST.sql"
del /F /Q "FINAL_UUID_TO_TEXT_FIX.sql"
del /F /Q "fix_analytics_column.sql"
del /F /Q "FIX_ADMIN_CANTEEN_IDS.sql"
del /F /Q "FIX_ANALYTICS_UUID_ERROR.sql"
del /F /Q "fix_trigger_urgent.sql"
del /F /Q "IDENTIFY_UUIDS.sql"
del /F /Q "insert_existing_admins.sql"
del /F /Q "MANUAL_MAPPING_FIX.sql"
del /F /Q "MIGRATION_WITH_TRIGGERS.sql"
del /F /Q "POPULATE_CANTEENS.sql"
del /F /Q "QUICK_FIX_ANALYTICS.sql"
del /F /Q "QUICK_FIX_create_admins_table.sql"
del /F /Q "set_commission_4_percent.sql"
del /F /Q "setup_analytics_quick.sql"
del /F /Q "SHOW_UUIDS_SIMPLE.sql"
del /F /Q "SHOW_UUID_MAPPING.sql"
del /F /Q "SIMPLE_FIX_FINAL.sql"
del /F /Q "SIMPLE_TEXT_ID_MIGRATION.sql"
del /F /Q "test_percentile_calculations.sql"
del /F /Q "ULTRA_SIMPLE_FIX.sql"
del /F /Q "update_function_only.sql"
del /F /Q "VERIFY_CANTEEN_IDS.sql"
```

---

## ✅ KEEP THESE FILES ONLY:

### In Root Directory:
```
✅ README.md (if exists - project documentation)
✅ .gitignore
✅ package.json
✅ package-lock.json
✅ tsconfig.json
✅ vite.config.ts
✅ index.html
❌ All other .md files - DELETE
```

### In Database / database_migrations:
```
✅ Database/COMPLETE_DATABASE_SCHEMA.sql
✅ Database/LOGIN_CREDENTIALS.md  
❌ All other .sql files - DELETE
```

### Source Code:
```
✅ Keep ALL files in src/
✅ Keep ALL files in public/
```

---

## 🚀 ONE-COMMAND CLEANUP (PowerShell)

Copy and paste this entire script:

```powershell
# Navigate to project root
cd "c:\Users\samiu\OneDrive\Desktop\CanteenQ_Web_Production"

# Delete all .md files except README.md
Get-ChildItem -Path . -Filter "*.md" -File | Where-Object { $_.Name -ne "README.md" } | Remove-Item -Force

Write-Host "✅ Deleted all .md files except README.md"

# Delete old SQL migrations
cd database_migrations
Get-ChildItem -Path . -Filter "*.sql" -File | Remove-Item -Force

Write-Host "✅ Deleted all old SQL migration files"

cd ..
Write-Host "🎉 Cleanup complete!"
```

---

## 📊 BEFORE vs AFTER:

### Before Cleanup:
```
Root: ~135 .md files
database_migrations: ~42 .sql files
Total: ~177 unnecessary files
```

### After Cleanup:
```
Root: 1 file (README.md only)
Database: 2 files (COMPLETE_DATABASE_SCHEMA.sql, LOGIN_CREDENTIALS.md)
Total: 3 documentation files only
```

---

## ⚡ QUICK CLEANUP STEPS:

1. **Open PowerShell as Administrator**

2. **Run this command:**
   ```powershell
   cd "c:\Users\samiu\OneDrive\Desktop\CanteenQ_Web_Production"
   
   # Delete root .md files (keep README.md)
   Get-ChildItem -Filter "*.md" -File | Where-Object { $_.Name -ne "README.md" } | Remove-Item -Force
   
   # Delete old SQL migrations (all)
   Get-ChildItem -Path "database_migrations" -Filter "*.sql" -File | Remove-Item -Force
   ```

3. **Verify cleanup:**
   ```powershell
   # Should show only README.md (if it exists)
   Get-ChildItem -Filter "*.md" -File
   
   # Should show nothing
   Get-ChildItem -Path "database_migrations" -Filter "*.sql" -File
   ```

---

## 🎯 FINAL PROJECT STRUCTURE:

```
CanteenQ_Web_Production/
├── .gitignore
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── README.md (optional)
│
├── Database/
│   ├── COMPLETE_DATABASE_SCHEMA.sql  ← Only database schema
│   └── LOGIN_CREDENTIALS.md          ← Only credentials guide
│
├── src/
│   ├── components/ (all kept)
│   ├── utils/ (all kept)
│   ├── context/ (all kept)
│   └── ... (all source code kept)
│
└── public/ (all kept)
```

**Clean and minimal!** 🎉

---

## ✅ VERIFY CLEANUP WORKED:

```powershell
# Count .md files in root (should be 0 or 1)
(Get-ChildItem -Filter "*.md" -File).Count

# Count .sql files in database_migrations (should be 0)
(Get-ChildItem -Path "database_migrations" -Filter "*.sql" -File).Count

# List Database folder (should show 2 files only)
Get-ChildItem -Path "Database"
```

---

## 🚨 IF YOU MADE A MISTAKE:

Restore from backup:
```powershell
# Copy back from backup
xcopy /E /I ..\CanteenQ_Backup_2024_12_15 .
```

---

**Run the PowerShell commands above to clean up all outdated files!** 🗑️✨
