// Script to apply the migration to Supabase
const { execSync } = require('child_process');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Check if Supabase CLI is installed
try {
  console.log('Checking Supabase CLI...');
  execSync('supabase --version', { stdio: 'inherit' });
} catch (error) {
  console.error('Supabase CLI is not installed. Please install it first.');
  process.exit(1);
}

// Apply migration
try {
  console.log('Applying migration...');
  execSync('supabase db push', { stdio: 'inherit' });
  console.log('Migration applied successfully!');
} catch (error) {
  console.error('Failed to apply migration:', error.message);
  process.exit(1);
}