
import { supabase } from '../lib/supabase';
import { User, Admin } from '../types';
import { useUser } from '@clerk/clerk-react';
import { useEffect, useState, createContext, useContext } from 'react';
import { AdminBankDetails } from '../components/admin/AdminSettingsModal';

interface AuthContextType {
  currentUser: User | null;
  currentAdmin: Admin | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string, isAdminLogin: boolean) => Promise<boolean>;
  logout: () => void;
  updateAdminBankDetails: (bankDetails: AdminBankDetails) => Promise<void>;
  createCanteenAdmin: (email: string, password: string, canteenId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// REMOVED: Hardcoded credentials - now stored in database!
// Credentials are now in the 'admins' table in Supabase
// To add/modify admins, use the master admin interface or run SQL queries

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);


  const isAuthenticated = currentUser !== null || currentAdmin !== null;
  const isAdmin = currentAdmin !== null;



  const logout = () => {
    setCurrentUser(null);
    setCurrentAdmin(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentAdmin');
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const savedAdmin = localStorage.getItem('currentAdmin');

    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    if (savedAdmin) {
      setCurrentAdmin(JSON.parse(savedAdmin));
    }
  }, []);

  const { user: clerkUser, isSignedIn: clerkIsSignedIn } = useUser();

  useEffect(() => {
    if (clerkIsSignedIn && clerkUser) {
      // Map Clerk user to your User type
      const user: User = {
        id: clerkUser.id,
        name: clerkUser.fullName || clerkUser.firstName || '',
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        // Add other fields as necessary, or fetch from your database if they are not in Clerk
        department: '', // Placeholder
        year: '', // Placeholder
        mobile: '', // Placeholder
        registerNumber: '' // Placeholder
      };
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else if (!clerkIsSignedIn) {
      setCurrentUser(null);
      localStorage.removeItem('currentUser');
    }
  }, [clerkUser, clerkIsSignedIn]);

  // Admin login function - NOW USES DATABASE!
  const login = async (email: string, password: string, isAdminLogin: boolean): Promise<boolean> => {
    if (isAdminLogin) {
      try {
        // Call database function to authenticate admin
        const { data, error } = await supabase.rpc('admin_login', {
          p_email: email,
          p_password: password
        });

        if (error) {
          console.error('Login error:', error);
          return false;
        }

        // Check if login was successful
        if (!data || data.length === 0 || !data[0].success) {
          console.error('Login failed:', data?.[0]?.message || 'Invalid credentials');
          return false;
        }

        const adminData = data[0];
        console.log('🔍 Admin data from database:', adminData);

        // Create admin user object
        const adminUser: Admin = {
          id: adminData.id,
          email: adminData.email,
          canteenId: adminData.canteen_id || undefined,
          isMasterAdmin: adminData.is_master_admin,
          bankDetails: adminData.is_master_admin ? {
            accountNumber: adminData.account_number || '',
            ifscCode: adminData.ifsc_code || '',
            panNumber: adminData.pan_number || '',
            bankName: adminData.bank_name || ''
          } : undefined
        };

        console.log('✅ Admin user object created:', adminUser);
        console.log('📌 Canteen ID:', adminUser.canteenId);

        setCurrentAdmin(adminUser);
        localStorage.setItem('currentAdmin', JSON.stringify(adminUser));
        console.log('Admin login successful:', adminUser.email);
        return true;
      } catch (error) {
        console.error('Login exception:', error);
        return false;
      }
    }

    // For regular user login, we're using Clerk so this shouldn't be called
    return false;
  };

  // Function to update master admin bank details - NOW USES DATABASE!
  const updateAdminBankDetails = async (bankDetails: AdminBankDetails) => {
    if (currentAdmin && currentAdmin.isMasterAdmin) {
      try {
        // Update in database
        const { error } = await supabase
          .from('admins')
          .update({
            account_number: bankDetails.accountNumber,
            ifsc_code: bankDetails.ifscCode,
            pan_number: bankDetails.panNumber,
            bank_name: bankDetails.bankName
          })
          .eq('id', currentAdmin.id);

        if (error) {
          console.error('Error updating bank details:', error);
          return;
        }

        // Update local state
        const updatedAdmin = {
          ...currentAdmin,
          bankDetails: bankDetails
        };

        setCurrentAdmin(updatedAdmin);
        localStorage.setItem('currentAdmin', JSON.stringify(updatedAdmin));
        console.log('Bank details updated successfully');
      } catch (error) {
        console.error('Exception updating bank details:', error);
      }
    }
  };

  // Function to create or update a canteen admin account - NOW USES DATABASE!
  const createCanteenAdmin = async (email: string, password: string, canteenId: string): Promise<boolean> => {
    // Check if the current user is a master admin
    if (!currentAdmin?.isMasterAdmin) {
      console.error('Only master admins can create canteen admin accounts');
      return false;
    }

    try {
      // Check if admin exists
      const { data: existingAdmin } = await supabase
        .from('admins')
        .select('id')
        .eq('email', email)
        .single();

      if (existingAdmin) {
        // Update existing admin - need to call a stored procedure to hash password
        const { error } = await supabase.rpc('update_admin_password', {
          p_admin_id: existingAdmin.id,
          p_new_password: password,
          p_canteen_id: canteenId
        });

        if (error) {
          console.error('Error updating admin:', error);
          alert(`Failed to update admin: ${error.message}`);
          return false;
        }

        console.log('Updated existing canteen admin:', email, 'for canteen:', canteenId);
        alert(`✅ Admin ${email} updated successfully!`);
        return true;
      } else {
        // Create new admin - need to call a stored procedure to hash password
        const { error } = await supabase.rpc('create_new_admin', {
          p_email: email,
          p_password: password,
          p_canteen_id: canteenId
        });

        if (error) {
          console.error('Error creating admin:', error);
          alert(`Failed to create admin: ${error.message}`);
          return false;
        }

        console.log('New canteen admin created:', email, 'for canteen:', canteenId);
        alert(`✅ Admin ${email} created successfully!`);
        return true;
      }
    } catch (error) {
      console.error('Exception in createCanteenAdmin:', error);
      alert(`❌ Error: ${(error as Error).message}`);
      return false;
    }
  };

  const value = {
    currentUser,
    currentAdmin,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    updateAdminBankDetails,
    createCanteenAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};