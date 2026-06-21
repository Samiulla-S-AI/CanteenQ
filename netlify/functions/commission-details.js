import Razorpay from 'razorpay';

export const handler = async (event) => {
    // Handle OPTIONS for CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, OPTIONS'
            },
            body: ''
        };
    }

    // Only allow GET
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        // Extract orderId from path
        const pathParts = event.path.split('/');
        const orderId = pathParts[pathParts.length - 1];

        // Handle test endpoint
        if (orderId === 'test') {
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    status: 'ok',
                    message: 'Netlify Function is running',
                    environment: process.env.NODE_ENV || 'production'
                })
            };
        }

        // --- SERVER-SIDE VALIDATION (Security) ---
        // Razorpay order IDs always start with 'order_' followed by alphanumeric chars
        if (!orderId || typeof orderId !== 'string' || !/^order_[A-Za-z0-9]{14,}$/.test(orderId)) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Invalid order ID format' })
            };
        }

        // Initialize Razorpay
        const razorpay = new Razorpay({
            key_id: process.env.VITE_RAZORPAY_KEY_ID,
            key_secret: process.env.VITE_RAZORPAY_KEY_SECRET
        });

        // Fetch order details from Razorpay
        const order = await razorpay.orders.fetch(orderId);

        // Extract commission details from notes
        const originalAmount = order.notes.originalAmount || order.amount;
        const platformFee = order.notes.platformFee || 0;
        const canteenShare = order.notes.canteenShare || originalAmount;

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                orderId: order.id,
                originalAmount: parseInt(originalAmount),
                totalAmount: order.amount,
                currency: order.currency,
                platformFee: parseInt(platformFee),
                canteenShare: parseInt(canteenShare),
                platformFeePercentage: '1%'
            })
        };
    } catch (error) {
        console.error('Error fetching commission details:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: error.message })
        };
    }
};
