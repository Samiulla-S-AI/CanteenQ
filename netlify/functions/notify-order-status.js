import admin from 'firebase-admin';

const initFirebase = () => {
    if (admin.apps.length > 0) return true;

    try {
        const privateKeyRaw = process.env.VITE_FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;
        const privateKey = privateKeyRaw ? privateKeyRaw.replace(/\\n/g, '\n') : undefined;

        const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.VITE_FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;

        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string'
                ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
                : process.env.FIREBASE_SERVICE_ACCOUNT;
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            return true;
        }

        if (projectId && clientEmail && privateKey) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
            return true;
        }

        console.error('Firebase Admin init failed: Missing or invalid credentials in environment variables.');
        return false;
    } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error);
        return false;
    }
};

export const handler = async (event, context) => {
    // CORS headers for all responses
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
    }

    try {
        const { orderId, status, userEmail, orderNumber, itemsDescription } = JSON.parse(event.body);

        if (!userEmail || !status || !orderNumber) {
            return { statusCode: 400, body: 'Missing required fields' };
        }

        if (!initFirebase()) {
            console.error('Firebase Admin not initialized');
            return { statusCode: 500, body: 'Server configuration error: Firebase Admin init failed' };
        }

        const db = admin.firestore();

        // Find tokens for this user
        const tokensSnapshot = await db.collection('fcm_tokens')
            .where('userEmail', '==', userEmail)
            .get();

        if (tokensSnapshot.empty) {
            console.log('No tokens found for user:', userEmail);
            return { statusCode: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'No devices to notify' }) };
        }

        const tokens = tokensSnapshot.docs.map(doc => doc.data().token);

        // Construct notification message based on status
        const itemsText = itemsDescription ? `(${itemsDescription})` : '';
        let title = 'Order Update';
        let body = `Your order #${orderNumber} ${itemsText} status has changed to ${status}`;

        if (status === 'Pending') {
            title = 'Order Received 🎉';
            body = `We've received your order ${itemsText}. It's being prepared!`;
        } else if (status === 'Ready') {
            title = 'Order Ready! 🍽️';
            body = `Your order ${itemsText} is ready for pickup! Enjoy your meal.`;
        } else if (status === 'Completed') {
            title = 'Order Completed';
            body = `Your order #${orderNumber} ${itemsText} has been completed. Thank you!`;
        } else if (status === 'Preparing') {
            title = 'Cooking in Progress 🍳';
            body = `Your order ${itemsText} is now being prepared.`;
        }

        const message = {
            notification: {
                title,
                body,
            },
            data: {
                orderId: String(orderId || ''),
                status: String(status || ''),
                url: '/orders' // Action URL
            },
            tokens: tokens,
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`Sent ${response.successCount} messages; ${response.failureCount} failed.`);

        // Clean up invalid tokens
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                }
            });
            console.log('Removing invalid tokens:', failedTokens);
            // Ideally remove these from DB, but for now we skip to avoid complexity
        }

        return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Notification sent',
                successCount: response.successCount,
                failureCount: response.failureCount
            }),
        };

    } catch (error) {
        console.error('Error sending notification:', error);
        return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Failed to send notification', details: error.message }),
        };
    }
};
