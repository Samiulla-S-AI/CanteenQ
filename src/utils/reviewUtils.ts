import { supabase } from '../lib/supabase';
export interface Review {
  id: string;
  itemId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  likes: number;
  dislikes: number;
  userLiked: boolean;
  userDisliked: boolean;
}

/**
 * Fetch reviews for a specific food item
 * @param foodItemId The ID of the food item
 * @param userId Optional user ID to check if the user has liked/disliked reviews
 * @returns Array of reviews for the food item
 */
export const getFoodItemReviews = async (
  foodItemId: string,
  userId?: string
): Promise<Review[]> => {
  try {
    // Get reviews
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('food_item_id', foodItemId);
    
    if (reviewsError) throw reviewsError;
    
    // Get likes for each review if user is logged in
    let userLikes: Record<string, boolean | null> = {};
    
    if (userId) {
      // Try to load from localStorage first for faster response
      try {
        const storedLikes = localStorage.getItem(`userLikes_${userId}`);
        userLikes = storedLikes ? JSON.parse(storedLikes) : {};
      } catch (error) {
        console.error('Error loading likes from localStorage:', error);
      }
      
      // Also fetch from database to ensure we have the latest data
      const { data: likesData, error: likesError } = await supabase
        .from('review_likes')
        .select('review_id, is_like')
        .eq('user_id', userId);
        
      if (!likesError && likesData) {
        // Merge with localStorage data, with database taking precedence
        userLikes = likesData.reduce((acc: any, like: any) => {
          acc[like.review_id] = like.is_like;
          return acc;
        }, {...userLikes});
      }
    }
    
    // Get like/dislike counts for each review
    const likesPromises = reviewsData.map(async (review: any) => {
      const { data: likesCount, error: likesError } = await supabase
        .rpc('get_review_likes_count', { review_id: review.id });
        
      const { data: dislikesCount, error: dislikesError } = await supabase
        .rpc('get_review_dislikes_count', { review_id: review.id });
        
      return {
        reviewId: review.id,
        likes: likesError ? 0 : likesCount || 0,
        dislikes: dislikesError ? 0 : dislikesCount || 0
      };
    });
    
    const likesResults = await Promise.all(likesPromises);
    const likesMap = likesResults.reduce((acc: any, result: any) => {
      acc[result.reviewId] = { likes: result.likes, dislikes: result.dislikes };
      return acc;
    }, {});
    
    // Transform the data to match our Review interface
    const formattedReviews: Review[] = reviewsData.map((review: any) => ({
      id: review.id,
      itemId: review.food_item_id,
      userId: review.user_id || '',
      userName: review.user_name || 'Anonymous',
      rating: review.rating,
      comment: review.comment || '',
      createdAt: review.created_at,
      likes: likesMap[review.id]?.likes || 0,
      dislikes: likesMap[review.id]?.dislikes || 0,
      userLiked: userLikes[review.id] === true,
      userDisliked: userLikes[review.id] === false
    }));
    
    return formattedReviews;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
};

/**
 * Fetch reviews for multiple food items at once
 * @param foodItemIds Array of food item IDs
 * @param userId Optional user ID to check if the user has liked/disliked reviews
 * @returns Object mapping food item IDs to their reviews
 */
export const getMultipleFoodItemReviews = async (
  foodItemIds: string[],
  userId?: string
): Promise<Record<string, Review[]>> => {
  try {
    const result: Record<string, Review[]> = {};
    
    // Process items in parallel for better performance
    const reviewPromises = foodItemIds.map(async (itemId) => {
      const reviews = await getFoodItemReviews(itemId, userId);
      return { itemId, reviews };
    });
    
    const reviewResults = await Promise.all(reviewPromises);
    
    // Convert array of results to record object
    reviewResults.forEach(({ itemId, reviews }) => {
      result[itemId] = reviews;
    });
    
    return result;
  } catch (error) {
    console.error('Error fetching multiple food item reviews:', error);
    return {};
  }
};

/**
 * Get the average rating for a food item
 * @param reviews Array of reviews for the food item
 * @returns Average rating as a string with one decimal place
 */
export const getAverageRating = (reviews: Review[]): string => {
  if (reviews.length === 0) return '0.0';
  
  const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  return average.toFixed(1);
};