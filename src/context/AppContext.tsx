import React, { createContext, useContext, useState } from 'react';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { FoodItem, CartItem, Canteen, Order } from '../types';
import { Notification } from '../components/common/OrderNotificationSystem';
import { generateQRCode } from '../utils/qrCode';
import { saveCartToHistory } from '../utils/cartHistoryUtils';
import { useAuth } from './AuthContext';
import { fetchWithRetry } from '../utils/networkUtils';

interface Review {
  id: string;
  food_item_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface AppContextType {
  canteens: Canteen[];
  foodItems: FoodItem[];
  cart: CartItem[];
  orders: Order[];
  selectedCanteen: string | null;
  selectedBreakTime: string | null;
  selectedCategory: string | null;
  addToCart: (item: FoodItem, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  placeOrder: (items: CartItem[], userEmail: string, userId: string) => Promise<string>;
  setSelectedCanteen: (canteenId: string | null) => void;
  setSelectedBreakTime: (breakTime: string | null) => void;
  setSelectedCategory: (category: string | null) => void;
  updateFoodItem: (item: FoodItem) => void;
  addFoodItem: (item: Omit<FoodItem, 'id'>) => void;
  deleteFoodItem: (itemId: string) => void;
  addCanteen: (canteen: Omit<Canteen, 'id'>) => void;
  updateCanteen: (canteenId: string, canteen: Partial<Omit<Canteen, 'id'>>) => Promise<Canteen | null>;
  deleteCanteen: (canteenId: string) => Promise<boolean>;
  updateOrder: (orderId: string, status: Order['status']) => void;
  addReview: (foodItemId: string, rating: number, comment: string) => Promise<Review | null>;
  getReviews: (foodItemId: string) => Promise<Review[]>;
  refreshOrders: () => Promise<void>;
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  clearNotification: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedCanteen, setSelectedCanteen] = useState<string | null>(null);
  const [selectedBreakTime, setSelectedBreakTime] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('canteenq_notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert timestamp strings back to Date objects (JSON.parse doesn't preserve Date)
        return parsed.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) }));
      } catch {
        return [];
      }
    }
    return [];
  });
  const { currentUser } = useAuth();

  // Sync notifications to local storage
  React.useEffect(() => {
    localStorage.setItem('canteenq_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Load data from Supabase and set up real-time subscriptions
  React.useEffect(() => {
    loadCanteens();
    loadFoodItems();
    loadOrders();

    if (currentUser?.email) {
      loadNotifications();
    }

    // Set up real-time subscriptions
    const canteensSubscription = supabase
      .channel('canteens-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'canteens' }, (payload) => {
        console.log('Canteens change received:', payload);
        loadCanteens(); // Reload all canteens when any change occurs
      })
      .subscribe();

    const foodItemsSubscription = supabase
      .channel('food-items-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'food_items' }, (payload) => {
        console.log('Food items change received:', payload);
        loadFoodItems(); // Reload all food items when any change occurs
      })
      .subscribe();

    const ordersSubscription = supabase
      .channel('orders-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        console.log('Orders change received:', payload);
        loadOrders(); // Reload all orders when any change occurs
      })
      .subscribe();

    const notificationsSubscription = supabase
      .channel('notifications-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_email=eq.${currentUser?.email}`
      }, (payload) => {
        console.log('New notification received:', payload);
        // Specifically avoid admin notifications
        if (!payload.new.is_admin_notification) {
          const newNotif: Notification = {
            id: payload.new.id,
            title: payload.new.title,
            message: payload.new.message,
            type: payload.new.type as any,
            read: payload.new.read,
            items: payload.new.items,
            orderNumber: payload.new.order_number,
            timestamp: new Date(payload.new.created_at)
          };
          setNotifications(prev => [newNotif, ...prev]);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_email=eq.${currentUser?.email}`
      }, (payload) => {
        if (!payload.new.is_admin_notification) {
          setNotifications(prev => prev.map(n => n.id === payload.new.id ? { ...n, read: payload.new.read } : n));
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
        setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
      })
      .subscribe();

    // Clean up subscriptions when component unmounts
    return () => {
      canteensSubscription.unsubscribe();
      foodItemsSubscription.unsubscribe();
      ordersSubscription.unsubscribe();
      notificationsSubscription.unsubscribe();
    };
  }, [currentUser?.email]);

  const loadCanteens = async () => {
    try {
      const { data, error } = await supabase
        .from('canteens')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const canteensData: Canteen[] = data.map(item => ({
        id: item.id,
        name: item.name,
        isActive: item.is_active,
        image: item.image,
        accountNumber: item.account_number || '',
        ifscCode: item.ifsc_code || '',
        panNumber: item.pan_number || '',
        bankName: item.bank_name || ''
      }));

      setCanteens(canteensData);
    } catch (error) {
      console.error('Error loading canteens:', error);
    }
  };

  const loadFoodItems = async () => {
    try {
      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const foodItemsData: FoodItem[] = data.map(item => ({
        id: item.id,
        canteenId: item.canteen_id,
        name: item.name,
        price: item.price,
        rating: item.rating,
        image: item.image,
        category: item.category,
        breakTime: item.break_time,
        quantity: item.quantity,
        allTimeAvailable: item.all_time_available,
        isActive: item.is_active
      }));

      setFoodItems(foodItemsData);
    } catch (error) {
      console.error('Error loading food items:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const ordersData: Order[] = data.map(item => ({
        id: item.id,
        userId: item.user_id,
        userEmail: item.user_email,
        items: item.items,
        totalAmount: item.total_amount,
        status: item.status,
        orderNumber: item.order_number,
        timestamp: new Date(item.created_at),
        created_at: item.created_at,
        canteenId: item.canteen_id,
        qrCode: item.qr_code
      }));

      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const loadNotifications = async () => {
    if (!currentUser?.email) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_email', currentUser.email)
        .eq('is_admin_notification', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const notifs: Notification[] = data.map(item => ({
        id: item.id,
        title: item.title,
        message: item.message,
        type: item.type as any,
        read: item.read,
        items: item.items,
        orderNumber: item.order_number,
        timestamp: new Date(item.created_at)
      }));

      // Merge database notifications with any local optimistic notifications that failed to save
      setNotifications(prev => {
        const dbIds = new Set(notifs.map(n => n.id));
        const localOnly = prev.filter(p => !dbIds.has(p.id));

        return [...localOnly, ...notifs].sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      });
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const addToCart = (item: FoodItem, quantity = 1) => {
    if (quantity <= 0) {
      alert('Please select a valid quantity');
      return;
    }

    setCart(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, cartQuantity: cartItem.cartQuantity + quantity }
            : cartItem
        );
      }
      return [...prev, { ...item, cartQuantity: quantity }];
    });

    // Show success message
    alert(`${item.name} (Qty: ${quantity}) added to cart!`);
  };

  // Removed duplicate currentUser declaration

  // Use effect to save cart to localStorage and history when cart changes
  React.useEffect(() => {
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));

    console.log('Cart changed, current user:', currentUser);

    // Save to history if user is logged in
    if (currentUser && cart.length > 0) {
      console.log('User is logged in and cart has items, saving to history');
      // Calculate total amount
      const totalAmount = cart.reduce((sum, cartItem) => sum + (cartItem.price * cartItem.cartQuantity), 0);

      // Save to history
      saveCartToHistory(currentUser.id, currentUser.email, cart, totalAmount)
        .then(result => {
          if (result) {
            console.log('Cart saved to history successfully:', result);
          } else {
            console.error('Failed to save cart to history');
          }
        })
        .catch(error => console.error('Error saving cart history:', error));
    } else {
      console.log('Not saving to history because:', !currentUser ? 'user not logged in' : 'cart is empty');
    }
  }, [cart, currentUser]);

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, cartQuantity: quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const placeOrder = async (items: CartItem[], userEmail: string, userId: string): Promise<string> => {
    const orderNumber = `ORD${Date.now()}`;
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);

    try {
      // Save cart to history before placing order
      try {
        const { saveCartToHistory } = await import('../utils/cartHistoryUtils');
        await saveCartToHistory(userId, userEmail, items, totalAmount);
        console.log('Cart saved to history before placing order');
      } catch (historyError) {
        console.error('Error saving cart to history:', historyError);
        // Continue with order placement even if saving to history fails
      }

      // First insert order into database to get the order ID
      const { data, error } = await supabase
        .from('orders')
        .insert({
          user_id: null, // Set to null since Clerk ID is not in UUID format
          user_email: userEmail,
          canteen_id: items[0]?.canteenId || '',
          items: items,
          total_amount: totalAmount,
          status: 'Pending',
          order_number: orderNumber,
          qr_code: null // Will update this after we have the order ID
        })
        .select()
        .single();

      if (error) throw error;

      // Now generate QR code with the actual order ID
      const qrData = {
        email: userEmail,
        orderId: data.id,
        orderNumber,
        canteenId: items[0]?.canteenId || '',
        timestamp: new Date().toISOString()
      };

      console.log('Generating QR code with data:', qrData);
      const qrCode = await generateQRCode(qrData);

      // Update the order with the QR code
      await supabase
        .from('orders')
        .update({ qr_code: qrCode })
        .eq('id', data.id);

      // Update food item quantities in the database
      for (const item of items) {
        // Find the current food item to get its current quantity
        const currentItem = foodItems.find(foodItem => foodItem.id === item.id);
        if (currentItem) {
          const newQuantity = Math.max(0, currentItem.quantity - item.cartQuantity);

          // Update in Supabase
          await supabase
            .from('food_items')
            .update({ quantity: newQuantity })
            .eq('id', item.id);

          // Update in local state
          setFoodItems(prev =>
            prev.map(foodItem =>
              foodItem.id === item.id
                ? { ...foodItem, quantity: newQuantity }
                : foodItem
            )
          );
        }
      }

      const newOrder: Order = {
        id: data.id,
        userId: data.user_id,
        userEmail: data.user_email,
        items: data.items,
        totalAmount: data.total_amount,
        status: data.status,
        orderNumber: data.order_number,
        timestamp: new Date(data.created_at),
        created_at: data.created_at,
        canteenId: data.canteen_id,
        qrCode: qrCode
      };

      setOrders(prev => [newOrder, ...prev]);

      // Trigger Push Notification for the new order
      try {
        const itemsDescriptor = items.map(i => `${i.cartQuantity || 1}x ${i.name}`).join(', ');

        await fetchWithRetry('/.netlify/functions/notify-order-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: newOrder.id,
            status: newOrder.status,
            userEmail: newOrder.userEmail,
            orderNumber: newOrder.orderNumber,
            itemsDescription: itemsDescriptor
          })
        }, { timeout: 10000, retries: 2, retryDelay: 1000 });

        // Optimistically update local UI
        const optimisticNotif = {
          title: 'Order Received 🎉',
          message: `We've received your order. It's being prepared!`,
          type: 'success' as const,
          items: items.map(i => ({ name: i.name, quantity: i.cartQuantity || 1 })),
          orderNumber: newOrder.orderNumber,
          read: false,
        };
        addNotification(optimisticNotif);

        // Try inserting notification into Supabase database history (don't await throwing so it won't crash)
        supabaseAdmin.from('notifications').insert({
          user_email: newOrder.userEmail,
          title: optimisticNotif.title,
          message: optimisticNotif.message,
          type: optimisticNotif.type,
          read: false,
          items: optimisticNotif.items,
          order_id: newOrder.id,
          is_admin_notification: false
        }).then(({ error: insertError }) => {
          if (insertError) console.error("Silently failing Supabase insert due to RLS:", insertError);
        });

        console.log('Order created notification triggered for:', newOrder.orderNumber);
      } catch (notifyError) {
        console.error('Failed to trigger order creation notification:', notifyError);
      }

      // Don't clear cart after purchase to allow users to reorder if needed
      // clearCart();
      return orderNumber;
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order: ' + (error as Error).message);
      throw error;
    }
  };

  const updateFoodItem = async (updatedItem: FoodItem) => {
    try {
      console.log('Updating food item:', updatedItem);

      const { error } = await supabaseAdmin
        .from('food_items')
        .update({
          name: updatedItem.name,
          price: updatedItem.price,
          rating: updatedItem.rating,
          image: updatedItem.image,
          category: updatedItem.category,
          break_time: updatedItem.breakTime,
          quantity: updatedItem.quantity,
          canteen_id: updatedItem.canteenId,
          all_time_available: updatedItem.allTimeAvailable,
          is_active: updatedItem.isActive
        })
        .eq('id', updatedItem.id);

      if (error) {
        console.error('Supabase error:', error);
        alert(`Failed to update food item: ${error.message}`);
        throw error;
      }

      setFoodItems(prev =>
        prev.map(item => item.id === updatedItem.id ? updatedItem : item)
      );
      alert(`✅ ${updatedItem.name} updated successfully!`);
      console.log('Food item updated successfully:', updatedItem);
    } catch (error) {
      console.error('Error updating food item:', error);
      alert(`❌ Error: ${(error as Error).message}`);
    }
  };

  const addFoodItem = async (newItem: Omit<FoodItem, 'id'>) => {
    try {
      console.log('Adding food item:', newItem);

      const { data, error } = await supabaseAdmin
        .from('food_items')
        .insert({
          canteen_id: newItem.canteenId,
          name: newItem.name,
          price: newItem.price,
          rating: newItem.rating,
          image: newItem.image,
          category: newItem.category,
          break_time: newItem.breakTime,
          quantity: newItem.quantity,
          all_time_available: newItem.allTimeAvailable,
          is_active: newItem.isActive !== undefined ? newItem.isActive : true
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        alert(`Failed to add food item: ${error.message}`);
        throw error;
      }

      const item: FoodItem = {
        id: data.id,
        canteenId: data.canteen_id,
        name: data.name,
        price: data.price,
        rating: data.rating,
        image: data.image,
        category: data.category,
        breakTime: data.break_time,
        quantity: data.quantity,
        allTimeAvailable: data.all_time_available,
        isActive: data.is_active
      };

      setFoodItems(prev => [...prev, item]);
      alert(`✅ ${item.name} added successfully!`);
      console.log('Food item added successfully:', item);
    } catch (error) {
      console.error('Error adding food item:', error);
      alert(`❌ Error: ${(error as Error).message}`);
    }
  };

  const deleteFoodItem = async (itemId: string) => {
    try {
      const { error } = await supabaseAdmin
        .from('food_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setFoodItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting food item:', error);
    }
  };

  const addCanteen = async (newCanteen: Omit<Canteen, 'id'>) => {
    try {
      // Only send columns that exist in the canteen table
      const canteenId = crypto.randomUUID ? crypto.randomUUID() : `cnt-${Date.now()}`;
      const insertData: any = {
        id: canteenId,
        name: newCanteen.name,
        is_active: newCanteen.isActive,
        image: newCanteen.image || null,
        account_number: newCanteen.accountNumber || null,
        ifsc_code: newCanteen.ifscCode || null,
        pan_number: newCanteen.panNumber || null,
        bank_name: newCanteen.bankName || null
      };

      const { data, error } = await supabaseAdmin
        .from('canteens')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      const canteen: Canteen = {
        id: data.id,
        name: data.name,
        isActive: data.is_active,
        image: data.image,
        accountNumber: newCanteen.accountNumber || '',
        ifscCode: newCanteen.ifscCode || '',
        panNumber: newCanteen.panNumber || '',
        bankName: newCanteen.bankName || ''
      };

      setCanteens(prev => [...prev, canteen]);
    } catch (error) {
      console.error('Error adding canteen:', error);
    }
  };

  const updateCanteen = async (canteenId: string, updatedCanteen: Partial<Omit<Canteen, 'id'>>) => {
    try {
      // Only send columns that exist in the canteens table
      const updateData: any = {};

      if (updatedCanteen.name !== undefined) updateData.name = updatedCanteen.name;
      if (updatedCanteen.isActive !== undefined) updateData.is_active = updatedCanteen.isActive;
      if (updatedCanteen.image !== undefined) updateData.image = updatedCanteen.image;
      if (updatedCanteen.accountNumber !== undefined) updateData.account_number = updatedCanteen.accountNumber;
      if (updatedCanteen.ifscCode !== undefined) updateData.ifsc_code = updatedCanteen.ifscCode;
      if (updatedCanteen.panNumber !== undefined) updateData.pan_number = updatedCanteen.panNumber;
      if (updatedCanteen.bankName !== undefined) updateData.bank_name = updatedCanteen.bankName;

      const { data, error } = await supabaseAdmin
        .from('canteens')
        .update(updateData)
        .eq('id', canteenId)
        .select()
        .single();

      if (error) throw error;

      const updatedCanteenData: Canteen = {
        id: data.id,
        name: data.name,
        isActive: data.is_active,
        image: data.image,
        accountNumber: updatedCanteen.accountNumber || '',
        ifscCode: updatedCanteen.ifscCode || '',
        panNumber: updatedCanteen.panNumber || '',
        bankName: updatedCanteen.bankName || ''
      };

      setCanteens(prev =>
        prev.map(canteen => canteen.id === canteenId ? updatedCanteenData : canteen)
      );

      return updatedCanteenData;
    } catch (error) {
      console.error('Error updating canteen:', error);
      return null;
    }
  };

  const deleteCanteen = async (canteenId: string) => {
    try {
      // 1. Delete food items belonging to this canteen first (due to RLS/Foreign Key constraints)
      const { error: itemsError } = await supabaseAdmin
        .from('food_items')
        .delete()
        .eq('canteen_id', canteenId);

      if (itemsError) throw itemsError;

      // 2. Delete the canteen
      const { error } = await supabaseAdmin
        .from('canteens')
        .delete()
        .eq('id', canteenId);

      if (error) throw error;

      setCanteens(prev => prev.filter(c => c.id !== canteenId));
      setFoodItems(prev => prev.filter(item => item.canteenId !== canteenId));
      return true;
    } catch (error) {
      console.error('Error deleting canteen:', error);
      return false;
    }
  };
  const updateOrder = async (orderId: string, status: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev =>
        prev.map(order => order.id === orderId ? { ...order, status } : order)
      );

      // Trigger Push Notification
      const updatedOrder = orders.find(o => o.id === orderId);
      if (updatedOrder && updatedOrder.userEmail) {
        const itemsDescriptor = (updatedOrder.items || [])
          .map((i: any) => `${i.cartQuantity || i.quantity || 1}x ${i.name}`)
          .join(', ');

        try {
          await fetchWithRetry('/.netlify/functions/notify-order-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: updatedOrder.id,
              status: status,
              userEmail: updatedOrder.userEmail,
              orderNumber: updatedOrder.orderNumber,
              itemsDescription: itemsDescriptor
            })
          }, { timeout: 10000, retries: 2, retryDelay: 1000 });

          let notifTitle = 'Order Update';
          let notifMessage = `Your order #${updatedOrder.orderNumber} status has changed to ${status}`;
          if (status === 'Ready') {
            notifTitle = 'Order Ready! 🍽️';
            notifMessage = `Your order is ready for pickup! Enjoy your meal.`;
          } else if (status === 'Completed') {
            notifTitle = 'Order Completed';
            notifMessage = `Your order #${updatedOrder.orderNumber} has been completed. Thank you!`;
          } else if ((status as string) === 'Preparing') {
            notifTitle = 'Cooking in Progress 🍳';
            notifMessage = `Your order is now being prepared.`;
          }

          // Optimistically update local UI
          const optimisticNotif = {
            title: notifTitle,
            message: notifMessage,
            type: 'success' as const,
            items: (updatedOrder.items || []).map((i: any) => ({ name: i.name || 'Item', quantity: i.cartQuantity || i.quantity || 1 })),
            orderNumber: updatedOrder.orderNumber,
            read: false,
          };
          addNotification(optimisticNotif);

          // Try inserting notification into Supabase database history
          supabaseAdmin.from('notifications').insert({
            user_email: updatedOrder.userEmail,
            title: notifTitle,
            message: notifMessage,
            type: 'success',
            read: false,
            items: optimisticNotif.items,
            order_id: updatedOrder.id,
            is_admin_notification: false
          }).then(({ error: insertError }) => {
            if (insertError) console.error("Silently failing Supabase insert due to RLS:", insertError);
          });

          console.log('Notification triggered for order:', updatedOrder.orderNumber);
        } catch (notifyError) {
          console.error('Failed to trigger notification:', notifyError);
          // Don't fail the update if notification fails
        }
      }

    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const addReview = async (foodItemId: string, rating: number, comment: string): Promise<Review | null> => {
    if (!currentUser) {
      alert('You must be logged in to add a review');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          food_item_id: foodItemId,
          user_id: currentUser.id,
          user_name: currentUser.name || currentUser.email.split('@')[0],
          user_email: currentUser.email,
          rating,
          comment
        })
        .select()
        .single();

      if (error) throw error;

      // Update the food item's rating
      const reviews = await getReviews(foodItemId);
      const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

      await supabase
        .from('food_items')
        .update({ rating: avgRating })
        .eq('id', foodItemId);

      // Update local food items state
      setFoodItems(prev =>
        prev.map(item => item.id === foodItemId ? { ...item, rating: avgRating } : item)
      );

      return data as Review;
    } catch (error) {
      console.error('Error adding review:', error);
      return null;
    }
  };

  const getReviews = async (foodItemId: string): Promise<Review[]> => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('food_item_id', foodItemId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data as Review[];
    } catch (error) {
      console.error('Error getting reviews:', error);
      return [];
    }
  };

  // Notification functions
  const addNotification = async (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    // Left for backwards compatibility, but we now exclusively use Supabase
    setNotifications(prev => [{ ...notification, id: Date.now().toString(), timestamp: new Date(), read: false }, ...prev]);
  };

  const clearNotification = async (id: string) => {
    try {
      await supabaseAdmin.from('notifications').delete().eq('id', id);
      // Realtime listener will handle the local state update anyway, but we can optimistically update
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error clearing notification:', error);
    }
  };

  const value = {
    canteens,
    foodItems,
    cart,
    orders,
    selectedCanteen,
    selectedBreakTime,
    selectedCategory,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    placeOrder,
    addReview,
    getReviews,
    setSelectedCanteen,
    setSelectedBreakTime,
    setSelectedCategory,
    updateFoodItem,
    addFoodItem,
    deleteFoodItem,
    addCanteen,
    updateCanteen,
    deleteCanteen,
    updateOrder,
    refreshOrders: loadOrders,
    notifications,
    addNotification,
    clearNotification
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};