import Razorpay from 'razorpay';

export const handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { amount, receipt, notes } = JSON.parse(event.body);

    // --- SERVER-SIDE VALIDATION (Security) ---
    // Prevent tampered requests via curl/Postman/browser devtools
    if (!amount || typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid amount: must be a positive integer in paise' })
      };
    }

    // Minimum ₹1 (100 paise), Maximum ₹50,000 (5,000,000 paise)
    if (amount < 100 || amount > 5000000) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Amount out of allowed range (₹1 - ₹50,000)' })
      };
    }

    if (!receipt || typeof receipt !== 'string') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid receipt identifier' })
      };
    }

    // Initialize Razorpay with environment variables
    const razorpay = new Razorpay({
      key_id: process.env.VITE_RAZORPAY_KEY_ID,
      key_secret: process.env.VITE_RAZORPAY_KEY_SECRET
    });

    // Calculate platform fee (1% of the original amount)
    const platformFee = Math.round(amount * 0.01);
    const canteenShare = amount; // The original item price goes to canteen

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
    };

    const order = await razorpay.orders.create(options);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify(order)
    };
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
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
