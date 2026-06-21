// Script to apply the user_id fix migration
const { execSync } = require('child_process');
const path = require('path');

console.log('Applying user_id fix migration...');

try {
  // Run the migration using Supabase CLI
  execSync('npx supabase migration up --db-url postgresql://postgres:postgres@localhost:54322/postgres', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname)
  });

  console.log('Migration applied successfully!');
} catch (error) {
  console.error('Error applying migration:', error.message);
  process.exit(1);
}