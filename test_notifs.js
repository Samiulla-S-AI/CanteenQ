import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(5);
    console.log('Recent Notifications Data:', JSON.stringify(data, null, 2));
    console.log('Error:', error);
}
check();
