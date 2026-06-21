import React, { useState, useEffect } from 'react';
import { Star, Edit, Trash, X, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Button from '../common/Button';
import AddReviewForm from './AddReviewForm';

interface Review {
  id: string;
  food_item_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  rating: number;
  comment: string;
  created_at: string;
  edit_timestamp?: string;
}

interface ReviewSectionProps {
  foodItemId: string;
  onAddReview?: () => void;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ foodItemId, onAddReview }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCounts, setRatingCounts] = useState<number[]>([0, 0, 0, 0, 0]);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState<number>(5);
  const [editComment, setEditComment] = useState<string>('');
  const [showAddReviewForm, setShowAddReviewForm] = useState<boolean>(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchReviews();
    
    // Set up real-time subscription to reviews table
    const subscription = supabase
      .channel('reviews_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'reviews', filter: `food_item_id=eq.${foodItemId}` }, 
        (payload) => {
          // Refresh reviews when any change occurs
          fetchReviews();
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [foodItemId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('food_item_id', foodItemId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setReviews(data);
        
        // Calculate average rating
        if (data.length > 0) {
          const total = data.reduce((sum, review) => sum + review.rating, 0);
          setAverageRating(parseFloat((total / data.length).toFixed(1)));
          
          // Calculate rating counts
          const counts = [0, 0, 0, 0, 0];
          data.forEach(review => {
            counts[Math.floor(review.rating) - 1]++;
          });
          setRatingCounts(counts.reverse()); // 5 to 1 stars
        } else {
          // Default to 5 stars if no reviews exist
          setAverageRating(5.0);
          setRatingCounts([1, 0, 0, 0, 0]); // One 5-star rating
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const startEditingReview = (review: Review) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment || '');
  };

  const cancelEditingReview = () => {
    setEditingReviewId(null);
    setEditRating(5);
    setEditComment('');
  };

  const saveReviewEdit = async (reviewId: string) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          rating: editRating,
          comment: editComment,
          edit_timestamp: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error) throw error;

      // Update the review in the local state
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, rating: editRating, comment: editComment, edit_timestamp: new Date().toISOString() } 
          : review
      ));

      // Recalculate average rating
      const updatedReviews = reviews.map(review => 
        review.id === reviewId ? { ...review, rating: editRating } : review
      );
      const total = updatedReviews.reduce((sum, review) => sum + review.rating, 0);
      const newAverage = parseFloat((total / updatedReviews.length).toFixed(1));
      setAverageRating(newAverage);

      // Update rating counts
      const counts = [0, 0, 0, 0, 0];
      updatedReviews.forEach(review => {
        counts[Math.floor(review.rating) - 1]++;
      });
      setRatingCounts(counts.reverse());

      // Reset editing state
      cancelEditingReview();
    } catch (error) {
      console.error('Error updating review:', error);
      alert('Failed to update review');
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!currentUser) return;

    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      // Remove the review from the local state
      const updatedReviews = reviews.filter(review => review.id !== reviewId);
      setReviews(updatedReviews);

      // Recalculate average rating
      if (updatedReviews.length > 0) {
        const total = updatedReviews.reduce((sum, review) => sum + review.rating, 0);
        const newAverage = parseFloat((total / updatedReviews.length).toFixed(1));
        setAverageRating(newAverage);

        // Update rating counts
        const counts = [0, 0, 0, 0, 0];
        updatedReviews.forEach(review => {
          counts[Math.floor(review.rating) - 1]++;
        });
        setRatingCounts(counts.reverse());
      } else {
        setAverageRating(0);
        setRatingCounts([0, 0, 0, 0, 0]);
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review');
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold mb-4">Ratings & Reviews</h3>
      
      {/* Summary Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6 pb-4 border-b border-gray-200">
        <div className="flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-gray-800">{averageRating}</div>
          <div className="flex items-center mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                className={`w-4 h-4 ${star <= Math.round(averageRating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
              />
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-1">{reviews.length} reviews</div>
        </div>
        
        <div className="flex-1 w-full md:w-auto">
          {ratingCounts.map((count, index) => {
            const stars = 5 - index;
            const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            
            return (
              <div key={stars} className="flex items-center mb-1">
                <span className="text-xs font-medium w-8">{stars} ★</span>
                <div className="flex-1 mx-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-500 rounded-full" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 w-8">{count}</span>
              </div>
            );
          })}
        </div>
        
        <div className="w-full md:w-auto">
          {!showAddReviewForm ? (
            <Button 
              onClick={() => setShowAddReviewForm(true)}
              className="bg-[#FC8A14] hover:bg-orange-600 text-white"
            >
              Write a Review
            </Button>
          ) : null}
        </div>
      </div>
      
      {/* Add Review Form */}
      {showAddReviewForm && (
        <div className="mb-6 border-b border-gray-200 pb-6">
          <AddReviewForm 
            foodItemId={foodItemId} 
            onReviewAdded={() => {
              setShowAddReviewForm(false);
              fetchReviews();
              if (onAddReview) onAddReview();
            }}
            onCancel={() => setShowAddReviewForm(false)}
          />
        </div>
      )}
      
      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-4">Loading reviews...</div>
      ) : reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map(review => (
            <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
              {editingReviewId === review.id ? (
                // Edit mode
                <div className="ml-11">
                  <div className="mb-3">
                    <div className="flex space-x-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setEditRating(star)}
                          className="focus:outline-none"
                        >
                          <Star 
                            className={`w-5 h-5 ${star <= editRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      rows={3}
                      placeholder="Write your review here..."
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => saveReviewEdit(review.id)}
                      className="flex items-center text-xs bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Save
                    </button>
                    <button 
                      onClick={cancelEditingReview}
                      className="flex items-center text-xs bg-gray-500 text-white px-3 py-1 rounded-md hover:bg-gray-600"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View mode
                <>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        <span className="text-sm font-medium">{review.user_name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="font-medium">{review.user_name}</div>
                        <div className="flex items-center">
                          <div className="flex mr-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`w-3 h-3 ${star <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">{formatDate(review.created_at)}</span>
                          {review.edit_timestamp && (
                            <span className="text-xs text-gray-400 ml-2">(edited)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {currentUser && currentUser.id === review.user_id && (
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => startEditingReview(review)}
                          className="text-gray-400 hover:text-blue-600 p-1"
                          title="Edit review"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteReview(review.id)}
                          className="text-gray-400 hover:text-red-600 p-1"
                          title="Delete review"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {review.comment && (
                    <div className="text-sm text-gray-700 ml-11 mb-2">{review.comment}</div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          No reviews yet. Be the first to review!
        </div>
      )}
    </div>
  );
};

export default ReviewSection;