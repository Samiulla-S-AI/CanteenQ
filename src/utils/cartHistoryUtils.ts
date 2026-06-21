import { supabase, Database } from '../lib/supabase';

/**
 * Filter out duplicate cart histories based on items content
 * @param cartHistories Array of cart history items
 * @returns Filtered array with unique cart histories
 */
const filterDuplicateCartHistories = (cartHistories: Database['public']['Tables']['cart_history']['Row'][]): Database['public']['Tables']['cart_history']['Row'][] => {
  const seen = new Set();
  return cartHistories.filter(cart => {
    // Create a key based on the items content
    const itemsKey = JSON.stringify(cart.items.map((item: any) => ({
      id: item.id,
      quantity: item.cartQuantity || item.quantity || 1
    })).sort((a: any, b: any) => a.id.localeCompare(b.id)));
    
    // If we've seen this combination before, filter it out
    if (seen.has(itemsKey)) {
      return false;
    }
    
    // Otherwise, add it to our set and keep it
    seen.add(itemsKey);
    return true;
  });
};

// Type for cart history item
export type CartHistoryItem = Database['public']['Tables']['cart_history']['Row'];
export type CartHistoryInsert = Database['public']['Tables']['cart_history']['Insert'];
export type CartHistoryUpdate = Database['public']['Tables']['cart_history']['Update'];

// Flag to track if we've attempted to create the cart_history table
let cartHistoryTableCreated = false;

/**
 * Ensure the cart_history table exists
 * @returns Promise<boolean> - True if the table exists or was created
 */
const ensureCartHistoryTable = async (): Promise<boolean> => {
  // If we've already created the table, don't try again
  if (cartHistoryTableCreated) {
    return true;
  }

  try {
    console.log('Checking if cart_history table exists...');
    
    // Try to select from the table to see if it exists
    const { error: checkError } = await supabase
      .from('cart_history')
      .select('id')
      .limit(1);
    
    // If no error, table exists
    if (!checkError) {
      console.log('Cart history table exists!');
      cartHistoryTableCreated = true;
      return true;
    }
    
    // If table doesn't exist, use localStorage as fallback
    if (checkError.message.includes('does not exist')) {
      console.log('Cart history table does not exist, storing in localStorage instead');
      return false;
    }
    
    console.error('Error checking cart_history table:', checkError);
    return false;
  } catch (error) {
    console.error('Exception checking cart_history table:', error);
    return false;
  }
};

/**
 * Save cart to history
 * @param userId User ID
 * @param userEmail User email
 * @param items Cart items in JSON format
 * @param totalAmount Total amount of the cart
 * @returns The saved cart history entry
 */
export const saveCartToHistory = async (
  userId: string,
  userEmail: string,
  items: any,
  totalAmount: number
): Promise<CartHistoryItem | null> => {
  try {
    console.log('saveCartToHistory called with:', { 
      userId, 
      userEmail, 
      itemsCount: items?.length, 
      totalAmount 
    });
    
    if (!userId) {
      console.error('Cannot save cart history: Missing user ID');
      return null;
    }
    
    if (!userEmail) {
      console.error('Cannot save cart history: Missing user email');
      return null;
    }
    
    console.log('Saving cart to history for user:', userId);
    
    // Check if cart_history table exists
    const tableExists = await ensureCartHistoryTable();
    
    // If table doesn't exist, save to localStorage as fallback
    if (!tableExists) {
      console.log('Using localStorage fallback for cart history');
      
      // Create a cart history item
      const cartHistoryItem: CartHistoryItem = {
        id: crypto.randomUUID(),
        user_id: userId,
        user_email: userEmail,
        items,
        total_amount: totalAmount,
        is_converted_to_order: false,
        created_at: new Date().toISOString()
      } as CartHistoryItem;
      
      // Get existing cart history from localStorage
      const existingHistory = localStorage.getItem('cart_history');
      const cartHistory = existingHistory ? JSON.parse(existingHistory) : [];
      
      // Add new item to history
      cartHistory.push(cartHistoryItem);
      
      // Save back to localStorage
      localStorage.setItem('cart_history', JSON.stringify(cartHistory));
      
      console.log('Cart history saved to localStorage:', cartHistoryItem);
      return cartHistoryItem;
    }
    
    // If table exists, save to database
    console.log('Attempting to insert into cart_history table...');
    
    // Convert Clerk user ID format to UUID format or use a hash of the ID
    // This is needed because Supabase expects a UUID but Clerk provides a string ID
    const { data, error } = await supabase
      .from('cart_history')
      .insert({
        user_id: null, // Set to null since we can't convert Clerk ID to UUID
        user_email: userEmail,
        items,
        total_amount: totalAmount,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving cart to history:', error);
      console.error('Error details:', error.message, error.details, error.hint);
      return null;
    }

    console.log('Cart saved to history successfully:', data);
    return data;
  } catch (error) {
    console.error('Exception saving cart to history:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return null;
  }
};

/**
 * Get user's cart history
 * @param userId User ID
 * @param userEmail User email
 * @param limit Number of records to return (default: 10)
 * @returns Array of cart history items
 */
export const getUserCartHistory = async (
  userId: string,
  userEmail: string,
  limit: number = 10
): Promise<CartHistoryItem[]> => {
  try {
    // Check if cart_history table exists
    const tableExists = await ensureCartHistoryTable();
    
    // If table doesn't exist, get from localStorage
    if (!tableExists) {
      console.log('Using localStorage for getting user cart history');
      
      // Get existing cart history from localStorage
      const existingHistory = localStorage.getItem('cart_history');
      if (!existingHistory) {
        console.log('No cart history found in localStorage');
        return [];
      }
      
      // Parse history and filter by user ID or email
      const cartHistory = JSON.parse(existingHistory);
      const userHistory = cartHistory.filter((item: CartHistoryItem) => 
        item.user_id === userId || item.user_email === userEmail
      )
        .sort((a: CartHistoryItem, b: CartHistoryItem) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })
        .slice(0, limit);
      
      console.log('User cart history retrieved from localStorage');
      return userHistory;
    }
    
    // Get unique cart histories by comparing items JSON stringified
    const { data, error } = await supabase
      .from('cart_history')
      .select('*')
      .eq('user_email', userEmail) // Use user_email instead of user_id
      .order('created_at', { ascending: false })
      .limit(limit * 2); // Fetch more to account for filtering
      
    // Filter out duplicate carts (same items)
    const uniqueData = data ? filterDuplicateCartHistories(data) : [];
    // Return only the requested limit
    const limitedData = uniqueData.slice(0, limit);

    if (error) {
      console.error('Error fetching cart history:', error);
      return [];
    }

    return limitedData || [];
  } catch (error) {
    console.error('Exception fetching cart history:', error);
    return [];
  }
};

/**
 * Mark cart history as converted to order
 * @param cartHistoryId Cart history ID
 * @param orderId Order ID
 * @returns Success status
 */
export const markCartAsConverted = async (
  cartHistoryId: string,
  orderId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('cart_history')
      .update({
        is_converted_to_order: true,
        order_id: orderId,
      })
      .eq('id', cartHistoryId);

    if (error) {
      console.error('Error marking cart as converted:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception marking cart as converted:', error);
    return false;
  }
};

/**
 * Delete cart history entry
 * @param cartHistoryId Cart history ID
 * @returns Success status
 */
export const deleteCartHistory = async (cartHistoryId: string): Promise<boolean> => {
  try {
    // Check if cart_history table exists
    const tableExists = await ensureCartHistoryTable();
    
    // If table doesn't exist, try to delete from localStorage
    if (!tableExists) {
      console.log('Using localStorage for deleting cart history');
      
      // Get existing cart history from localStorage
      const existingHistory = localStorage.getItem('cart_history');
      if (!existingHistory) {
        console.log('No cart history found in localStorage');
        return false;
      }
      
      // Parse history and filter out the item to delete
      const cartHistory = JSON.parse(existingHistory);
      const filteredHistory = cartHistory.filter((item: CartHistoryItem) => item.id !== cartHistoryId);
      
      // Save filtered history back to localStorage
      localStorage.setItem('cart_history', JSON.stringify(filteredHistory));
      
      console.log('Cart history deleted from localStorage');
      return true;
    }
    
    // If table exists, delete from database
    const { error } = await supabase
      .from('cart_history')
      .delete()
      .eq('id', cartHistoryId);

    if (error) {
      console.error('Error deleting cart history:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception deleting cart history:', error);
    return false;
  }
};

/**
 * Restore cart from history
 * @param cartHistoryId Cart history ID
 * @returns Cart items and total amount
 */
export const restoreCartFromHistory = async (cartHistoryId: string): Promise<{ items: any; totalAmount: number } | null> => {
  try {
    // Check if cart_history table exists
    const tableExists = await ensureCartHistoryTable();
    
    // If table doesn't exist, try to restore from localStorage
    if (!tableExists) {
      console.log('Using localStorage for restoring cart history');
      
      // Get existing cart history from localStorage
      const existingHistory = localStorage.getItem('cart_history');
      if (!existingHistory) {
        console.log('No cart history found in localStorage');
        return null;
      }
      
      // Parse history and find the item to restore
      const cartHistory = JSON.parse(existingHistory);
      const historyItem = cartHistory.find((item: CartHistoryItem) => item.id === cartHistoryId);
      
      if (!historyItem) {
        console.log('Cart history item not found in localStorage');
        return null;
      }
      
      console.log('Cart history restored from localStorage');
      return {
        items: historyItem.items,
        totalAmount: historyItem.total_amount,
      };
    }
    
    // If table exists, restore from database
    const { data, error } = await supabase
      .from('cart_history')
      .select('items, total_amount')
      .eq('id', cartHistoryId)
      .single();

    if (error) {
      console.error('Error restoring cart from history:', error);
      return null;
    }

    return {
      items: data.items,
      totalAmount: data.total_amount,
    };
  } catch (error) {
    console.error('Exception restoring cart from history:', error);
    return null;
  }
};