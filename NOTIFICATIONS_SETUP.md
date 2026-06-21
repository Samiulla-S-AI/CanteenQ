
# Notification System Setup Guide

This guide explains how to configure the Push Notification system for CanteenQ.

## 1. Firebase Configuration

Ensure you have your Firebase project credentials.

### Environment Variables
You need to set the following environment variables in your Netlify dashboard (Site settings > Environment variables):

- `FIREBASE_SERVICE_ACCOUNT`: The complete JSON content of your Firebase Service Account key.
  - Go to Firebase Console > Project Settings > Service accounts.
  - Click "Generate new private key".
  - Copy the content of the JSON file.
  - Paste it as the value for `FIREBASE_SERVICE_ACCOUNT` in Netlify.
  
Alternatively, you can set individual variables if you prefer not to store the whole JSON:
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (Ensure line breaks are handled correctly)
- `VITE_FIREBASE_PROJECT_ID` (Already likely set)

## 2. Frontend Setup

The `NotificationPermission` component in `src/components/common/NotificationPermission.tsx` handles:
1. Checking if the user has granted permission.
2. Requesting permission with a polite UI.
3. retrieving the FCM Token.
4. Sending the token to the backend.

### VAPID Key
Ensure `VITE_FIREBASE_VAPID_KEY` is set in your `.env` or Netlify variables. You can generate a Key Pair in Firebase Console > Cloud Messaging > Web configuration.

## 3. Backend Functions

Two Netlify functions handle the backend logic:

- **`save-token`** (`/api/notifications/save-token`):
  - Receives `{ token }`.
  - Saves it to the `fcm_tokens` collection in Firestore.

- **`notify-order-status`** (`/api/notifications/notify-order-status`):
  - Receives `{ orderId, status, userEmail, orderNumber }`.
  - Queries Firestore to find the user's FCM token.
  - Sends a targeted push notification.
  - This function is automatically called by the `updateOrder` logic in `AppContext.tsx` whenever an order status changes.

## 4. Testing

1. Open the app and log in.
2. Accept the notification permission prompt.
3. Place an order.
4. Go to Admin Dashboard and change the status of the order.
5. You should receive a notification on the device where the order was placed.

