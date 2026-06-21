import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Button from '../common/Button';

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

interface AddReviewFormProps {
  foodItemId: string;
  onReviewAdded: () => void;
  onCancel?: () => void;
}

const AddReviewForm: React.FC<AddReviewFormProps> = ({ 
  foodItemId, 
  onReviewAdded,
  onCancel 
}) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const { currentUser } = useAuth();

  const handleStarClick = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const handleStarHover = (hoveredRating: number) => {
    setHoverRating(hoveredRating);
  };

  const handleStarLeave = () => {
    setHoverRating(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert('You must be logged in to add a review');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Set user_id to null to avoid foreign key constraint violation
      // The reviews table allows null user_id (ON DELETE SET NULL)
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          food_item_id: foodItemId,
          user_id: null, // Set to null instead of trying to use a UUID
          user_name: currentUser.name || currentUser.email.split('@')[0],
          user_email: currentUser.email,
          rating,
          comment
        })
        .select()
        .single();

      if (error) throw error;

      // Update the food item's rating
      await updateFoodItemRating(foodItemId);
      
      // Reset form
      setRating(5);
      setComment('');
      
      // Notify parent component
      onReviewAdded();
    } catch (error) {
      console.error('Error adding review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFoodItemRating = async (itemId: string) => {
    try {
      // Get all reviews for this item
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('food_item_id', itemId);

      if (error) throw error;

      if (reviews && reviews.length > 0) {
        // Calculate average rating
        const total = reviews.reduce((sum, review) => sum + review.rating, 0);
        const avgRating = parseFloat((total / reviews.length).toFixed(1));
        
        // Update the food item's rating
        // Note: The trigger function will automatically update the rating
        // This manual update is no longer needed as the trigger handles it
        // But we'll keep it as a fallback in case the trigger fails
        await supabase
          .from('food_items')
          .update({ rating: avgRating })
          .eq('id', itemId);
      }
    } catch (error) {
      console.error('Error updating food item rating:', error);
    }
  };

  const displayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg p-4 mb-4">
      <h4 className="text-lg font-semibold mb-4">Add Your Review</h4>
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2 font-medium">Rating</label>
        <div 
          className="flex space-x-2" 
          onMouseLeave={handleStarLeave}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => handleStarHover(star)}
              className="focus:outline-none transition-colors duration-200"
            >
              <Star 
                className={`w-8 h-8 ${star <= displayRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
              />
            </button>
          ))}
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2 font-medium">Comment</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
          rows={4}
          placeholder="Share your experience with this item..."
        />
      </div>
      
      <div className="flex space-x-3">
        <Button 
          type="submit" 
          className="bg-[#FC8A14] hover:bg-orange-600 text-white px-6"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
        
        {onCancel && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="border-gray-300 text-gray-700"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

export default AddReviewForm;