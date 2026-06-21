import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, ThumbsDown, MoreVertical } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ReviewListProps {
  foodItemId: string;
}

const ReviewList: React.FC<ReviewListProps> = ({ foodItemId }) => {
  const { getReviews } = useApp();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const reviewsData = await getReviews(foodItemId);
        setReviews(reviewsData);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [foodItemId, getReviews]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return <div className="text-center py-4">Loading reviews...</div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No reviews yet for this item.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map(review => (
        <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
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
                </div>
              </div>
            </div>
          </div>
          
          {review.comment && (
            <div className="text-sm text-gray-700 ml-11 mb-2">{review.comment}</div>
          )}
          
          <div className="flex items-center ml-11">
            <button className="flex items-center text-xs text-gray-500 hover:text-gray-700 mr-4">
              <ThumbsUp className="w-3 h-3 mr-1" />
              Helpful
            </button>
            <button className="flex items-center text-xs text-gray-500 hover:text-gray-700">
              <ThumbsDown className="w-3 h-3 mr-1" />
              Not helpful
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReviewList;