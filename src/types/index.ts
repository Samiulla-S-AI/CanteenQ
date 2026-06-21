export interface User {
  id: string;
  name: string;
  department: string;
  year: string;
  mobile: string;
  email: string;
  registerNumber: string;
}

export interface Admin {
  id: string;
  email: string;
  canteenId?: string;
  isMasterAdmin: boolean;
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    panNumber: string;
    bankName: string;
  };
}

export interface Canteen {
  id: string;
  name: string;
  isActive: boolean;
  image: string;
  accountNumber?: string;
  ifscCode?: string;
  panNumber?: string;
  bankName?: string;
}

export interface FoodItem {
  id: string;
  canteenId: string;
  name: string;
  price: number;
  rating: number;
  image: string;
  category: 'Drink' | 'Snack' | 'Food';
  breakTime: 'Morning' | 'Afternoon' | 'Evening';
  quantity: number;
  allTimeAvailable?: boolean; // If true, item shows in all break times
  isActive?: boolean; // If false, item is out of stock and hidden from users
}

export interface CartItem extends FoodItem {
  cartQuantity: number;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  items: CartItem[];
  totalAmount: number;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Completed';
  orderNumber: string;
  timestamp: Date | string; // Frontend uses this
  created_at: Date | string; // Database uses this
  canteenId: string;
  qrCode: string;
}

export type BreakTime = 'Morning' | 'Afternoon' | 'Evening';
export type Category = 'Drink' | 'Snack' | 'Food';