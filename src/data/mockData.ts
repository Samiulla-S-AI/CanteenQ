import { Canteen, FoodItem } from '../types';

export const mockCanteens: Canteen[] = [
  {
    id: 'dragon',
    name: 'Dragon Canteen',
    isActive: true,
    image: 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg'
  },
  {
    id: 'snackspot',
    name: 'The Snack Spot',
    isActive: true,
    image: 'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg'
  },
  {
    id: 'foodjunction',
    name: 'Food Junction',
    isActive: true,
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'
  },
  {
    id: 'campuscafe',
    name: 'Campus Cafe',
    isActive: false,
    image: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg'
  },
  {
    id: 'quickbites',
    name: 'Quick Bites',
    isActive: true,
    image: 'https://images.pexels.com/photos/776538/pexels-photo-776538.jpeg'
  },
  {
    id: 'mdscanteen',
    name: 'MDS Canteen',
    isActive: true,
    image: 'https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg'
  }
];

export const mockFoodItems: FoodItem[] = [
  // Dragon Canteen Items
  {
    id: '1',
    canteenId: 'dragon',
    name: 'Masala Dosa',
    price: 45,
    rating: 4.5,
    image: 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg',
    category: 'Food',
    breakTime: 'Morning',
    quantity: 20
  },
  {
    id: '2',
    canteenId: 'dragon',
    name: 'Filter Coffee',
    price: 15,
    rating: 4.2,
    image: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg',
    category: 'Drink',
    breakTime: 'Morning',
    quantity: 30
  },
  {
    id: '3',
    canteenId: 'dragon',
    name: 'Biryani',
    price: 85,
    rating: 4.8,
    image: 'https://images.pexels.com/photos/8119547/pexels-photo-8119547.jpeg',
    category: 'Food',
    breakTime: 'Afternoon',
    quantity: 15
  },
  // Snack Spot Items
  {
    id: '4',
    canteenId: 'snackspot',
    name: 'Samosa',
    price: 12,
    rating: 4.3,
    image: 'https://images.pexels.com/photos/14477797/pexels-photo-14477797.jpeg',
    category: 'Snack',
    breakTime: 'Evening',
    quantity: 25
  },
  {
    id: '5',
    canteenId: 'snackspot',
    name: 'Mango Juice',
    price: 25,
    rating: 4.1,
    image: 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg',
    category: 'Drink',
    breakTime: 'Afternoon',
    quantity: 20
  },
  {
    id: '6',
    canteenId: 'snackspot',
    name: 'Vada Pav',
    price: 18,
    rating: 4.4,
    image: 'https://images.pexels.com/photos/4958792/pexels-photo-4958792.jpeg',
    category: 'Snack',
    breakTime: 'Evening',
    quantity: 30
  },
  // Food Junction Items
  {
    id: '7',
    canteenId: 'foodjunction',
    name: 'Chicken Curry',
    price: 95,
    rating: 4.6,
    image: 'https://images.pexels.com/photos/2474658/pexels-photo-2474658.jpeg',
    category: 'Food',
    breakTime: 'Afternoon',
    quantity: 12
  },
  {
    id: '8',
    canteenId: 'foodjunction',
    name: 'Lassi',
    price: 30,
    rating: 4.0,
    image: 'https://images.pexels.com/photos/1337825/pexels-photo-1337825.jpeg',
    category: 'Drink',
    breakTime: 'Afternoon',
    quantity: 18
  },
  // Quick Bites Items
  {
    id: '9',
    canteenId: 'quickbites',
    name: 'Sandwich',
    price: 35,
    rating: 4.2,
    image: 'https://images.pexels.com/photos/1603901/pexels-photo-1603901.jpeg',
    category: 'Snack',
    breakTime: 'Morning',
    quantity: 22
  },
  {
    id: '10',
    canteenId: 'quickbites',
    name: 'Cold Coffee',
    price: 40,
    rating: 4.5,
    image: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg',
    category: 'Drink',
    breakTime: 'Evening',
    quantity: 15
  },
  // MDS Canteen Items
  {
    id: '11',
    canteenId: 'mdscanteen',
    name: 'Pani Puri',
    price: 20,
    rating: 4.7,
    image: 'https://images.pexels.com/photos/4958666/pexels-photo-4958666.jpeg',
    category: 'Snack',
    breakTime: 'Evening',
    quantity: 28
  },
  {
    id: '12',
    canteenId: 'mdscanteen',
    name: 'Idli Sambhar',
    price: 25,
    rating: 4.3,
    image: 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg',
    category: 'Food',
    breakTime: 'Morning',
    quantity: 20
  }
];