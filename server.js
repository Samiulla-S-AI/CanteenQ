import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import admin from 'firebase-admin';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
const serviceAccount = await import('./config/canteenqnotification-b61e0-firebase-adminsdk-fbsvc-32189aaaa5.json', {
  with: { type: 'json' }
});

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount.default)
});

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.VITE_RAZORPAY_KEY_ID,
  key_secret: process.env.VITE_RAZORPAY_KEY_SECRET
});

// Create Razorpay order
app.post('/api/create-razorpay-order', async (req, res) => {
  try {
    const { amount, receipt, notes } = req.body;

    // Calculate platform fee (1% of the original amount)
    const platformFee = Math.round(amount * 0.01);
    const canteenShare = amount; // The original item price

    // Total amount the customer will pay
    const totalAmount = amount + platformFee;

    console.log(`Original Amount (Canteen Share): ${amount / 100} INR`);
    console.log(`Platform Fee (1%): ${platformFee / 100} INR`);
    console.log(`Total Amount (Customer Pays): ${totalAmount / 100} INR`);

    // Add commission details to notes
    const updatedNotes = {
      ...notes,
      originalAmount: amount,
      platformFee: platformFee,
      canteenShare: canteenShare,
      platformFeePercentage: '1%'
    };

    const options = {
      amount: totalAmount, // Use the total amount including platform fee
      currency: 'INR',
      receipt,
      notes: updatedNotes,
      // In a real implementation, you would set up transfers for split payments
      // This requires setting up Razorpay connected accounts for each canteen
      // transfers: [
      //   {
      //     account: 'CANTEEN_RAZORPAY_ACCOUNT_ID',
      //     amount: canteenShare,
      //     currency: 'INR'
      //   },
      //   {
      //     account: 'PLATFORM_ADMIN_RAZORPAY_ACCOUNT_ID',
      //     amount: platformFee,
      //     currency: 'INR'
      //   }
      // ]
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint for health checks
app.get('/api/commission-details/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Get commission details
app.get('/api/commission-details/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    // Fetch order details from Razorpay
    const order = await razorpay.orders.fetch(orderId);

    // Extract commission details from notes
    const originalAmount = order.notes.originalAmount || order.amount;
    const platformFee = order.notes.platformFee || 0;
    const canteenShare = order.notes.canteenShare || originalAmount;

    res.json({
      orderId: order.id,
      originalAmount: parseInt(originalAmount),
      totalAmount: order.amount,
      currency: order.currency,
      platformFee: parseInt(platformFee),
      canteenShare: parseInt(canteenShare),
      platformFeePercentage: '1%'
    });
  } catch (error) {
    console.error('Error fetching commission details:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify Razorpay payment
app.post('/api/verify-razorpay-payment', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Create a signature using the order_id and payment_id
    const expectedSignature = crypto.createHmac('sha256', process.env.VITE_RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    // Compare the signatures
    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      res.json({ verified: true });
    } else {
      res.status(400).json({ verified: false, error: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    res.status(500).json({ verified: false, error: error.message });
  }
});

// Send notification endpoint
app.post('/api/send-notification', async (req, res) => {
  const { token, title, body } = req.body;

  if (!token || !title || !body) {
    return res.status(400).json({ error: 'Missing token, title, or body' });
  }

  const message = {
    notification: {
      title,
      body,
    },
    token: token,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    res.status(200).json({ success: true, response });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API-only server for Render deployment
// Frontend will be handled by Netlify

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});