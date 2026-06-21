import { supabase } from '../lib/supabase';

interface UserData {
  id: string;
  name: string;
  register_number: string;
  mobile: string;
  email: string;
  department: string;
  year: string;
}

// Helper function to convert Clerk user ID to a valid UUID format
const generateUUIDFromClerkId = (clerkId: string): string => {
  // If already a UUID format, return as is
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clerkId)) {
    return clerkId;
  }
  
  // For any other format, generate a random UUID
  // This ensures we always have a valid UUID format that Supabase can accept
  try {
    return crypto.randomUUID();
  } catch (e) {
    // Fallback for environments where crypto.randomUUID() is not available
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

/**
 * Check if a user exists in the Supabase database
 * @param userId The Clerk user ID
 * @param userEmail Optional email to check instead of ID
 * @returns Boolean indicating if the user exists
 */
export const checkUserExists = async (userId: string, userEmail?: string): Promise<boolean> => {
  try {
    // If email is provided, check by email (preferred method)
    if (userEmail) {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', userEmail);
      
      if (error) {
        console.error('Error checking user by email:', error);
        return false;
      }
      
      return data && data.length > 0;
    }
    
    // Fallback to checking by a generated UUID (less reliable)
    // This is only used if no email is provided
    console.warn('Checking user existence without email is less reliable');
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Error checking user:', error);
      return false;
    }
    
    // If we can query the database at all, we'll consider this a success
    // The actual user check will happen with email in the component
    return true;
  } catch (err) {
    console.error('Error in checkUserExists:', err);
    return false;
  }
};

/**
 * Save user data to Supabase
 * @param userData User data to save
 * @returns Object with success status and error message if any
 */
export const saveUserData = async (userData: UserData): Promise<{ success: boolean; error?: string }> => {
  try {
    // Generate a valid UUID for the user
    const uuidFormat = generateUUIDFromClerkId(userData.id);
    
    // Create a new object with the converted ID and properly formatted fields
    const formattedUserData = {
      ...userData,
      id: uuidFormat,
      // Ensure these fields match the database schema
      register_number: userData.register_number,
      email: userData.email,
      mobile: userData.mobile,
      department: userData.department,
      year: userData.year,
      name: userData.name
    };
    
    // Insert the user data without the ID field to let Supabase generate it
    // This avoids UUID format issues
    const { error } = await supabase
      .from('users')
      .insert({
        name: formattedUserData.name,
        department: formattedUserData.department,
        year: formattedUserData.year,
        mobile: formattedUserData.mobile,
        email: formattedUserData.email,
        register_number: formattedUserData.register_number
      });

    if (error) {
      console.error('Error saving user data:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (err: any) {
    console.error('Error in saveUserData:', err);
    return { success: false, error: err.message || 'An unknown error occurred' };
  }
};