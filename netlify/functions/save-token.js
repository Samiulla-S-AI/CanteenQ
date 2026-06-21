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
        const { token, userEmail, userId } = JSON.parse(event.body);

        if (!token) {
            return { statusCode: 400, body: 'Missing token' };
        }

        if (!initFirebase()) {
            console.error('Firebase Admin not initialized');
            return { statusCode: 500, body: 'Server configuration error: Firebase Admin init failed' };
        }

        const db = admin.firestore();
        await db.collection('fcm_tokens').doc(token).set({
            token: token,
            userEmail: userEmail || null,
            userId: userId || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            userAgent: event.headers['user-agent'] || 'unknown',
        }, { merge: true });
        console.log('Token saved to Firestore for user:', userEmail);

        return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Token saved successfully' }),
        };
    } catch (error) {
        console.error('Error saving token:', error);
        return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Failed to save token' }),
        };
    }
};
