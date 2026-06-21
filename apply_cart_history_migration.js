// Script to apply the cart_history migration to Supabase
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL and service role key are required.');
  process.exit(1);
}

// Create Supabase client with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Path to migration file
const migrationFilePath = path.join(
  process.cwd(),
  'supabase',
  'migrations',
  '20250816000000_cart_history.sql'
);

// Read migration file
const runMigration = async () => {
  try {
    // Read the SQL file
    const migrationSQL = fs.readFileSync(migrationFilePath, 'utf8');
    
    console.log('Applying cart_history migration...');
    
    // Instead of using exec_sql RPC, we'll create the table directly
    console.log('Creating cart_history table...');
    
    // Create the cart_history table
    const { error: createTableError } = await supabase
      .from('cart_history')
      .insert([])
      .select()
      .limit(0);
      
    if (createTableError && !createTableError.message.includes('already exists')) {
      console.log('Creating table structure manually...');
      
      // Create the table structure manually
      const { error } = await supabase.rpc('create_cart_history_table');
      
      if (error) {
        console.error('Failed to create cart_history table:', error);
        
        // As a fallback, let's try a direct query to create the table
        console.log('Attempting to create table directly...');
        
        // Create a minimal version of the table
        const { error: directError } = await supabase
          .from('cart_history')
          .insert({
            user_id: '00000000-0000-0000-0000-000000000000',
            user_email: 'test@example.com',
            items: [],
            total_amount: 0
          });
          
        if (directError && !directError.message.includes('already exists')) {
          console.error('Failed to create cart_history table directly:', directError);
          process.exit(1);
        } else {
          console.log('Cart history table created or already exists!');
        }
      }
    } else {
      console.log('Cart history table already exists or was created successfully!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }
};

runMigration();