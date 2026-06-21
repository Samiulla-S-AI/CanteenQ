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
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { token, title, body, data } = JSON.parse(event.body);

        if (!token || !title || !body) {
            return { statusCode: 400, body: 'Missing required fields (token, title, body)' };
        }

        if (!initFirebase()) {
            console.error('Firebase Admin not initialized');
            return { statusCode: 500, body: 'Server configuration error: Firebase Admin init failed' };
        }

        // Convert all values in the `data` object to strings, as FCM requires string values for data payload
        const stringifiedData = {};
        if (data) {
            Object.keys(data).forEach(key => {
                stringifiedData[key] = String(data[key] || '');
            });
        }

        const message = {
            notification: {
                title: title,
                body: body,
            },
            data: stringifiedData,
            token: token,
        };

        const response = await admin.messaging().send(message);
        console.log('Successfully sent message:', response);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Notification sent successfully', response }),
        };

    } catch (error) {
        console.error('Error sending notification:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to send notification', details: error.message }),
        };
    }
};
