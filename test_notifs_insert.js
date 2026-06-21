import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    const { data, error } = await supabase.from('notifications').insert({
        user_email: 'test@example.com',
        title: 'Order Received 🎉',
        message: `We've received your order. It's being prepared!`,
        type: 'success',
        read: false,
        items: [{ name: 'Test Item', quantity: 1, orderNumber: 'TEST1234' }],
        order_id: '929213c0-688e-42a2-838e-65e38dcda7f0',
        is_admin_notification: false
    }).select();

    console.log('Result Data:', JSON.stringify(data, null, 2));
    console.log('Error:', error);
}
check();
