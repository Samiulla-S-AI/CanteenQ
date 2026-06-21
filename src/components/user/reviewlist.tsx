import React from 'react';
import { Star } from 'lucide-react';
import { Review } from '../../types';

interface ReviewListProps {
  reviews: Review[];
  isExpanded: boolean;
}

const ReviewList: React.FC<ReviewListProps> = ({ reviews, isExpanded }) => {
  if (!isExpanded) return null;
  
  if (reviews.length === 0) {
    return (
      <div className="mt-2 text-sm text-gray-500 italic">
        No reviews yet. Be the first to review!
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      <h4 className="font-medium text-gray-700 text-sm">Customer Reviews</h4>
      {reviews.map((review, index) => (
        <div key={index} className="border-t border-gray-100 pt-2">
          <div className="flex items-center">
            <div className="flex text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-4 h-4 ${i < review.rating ? 'fill-current' : ''}`} 
                />
              ))}
            </div>
            <span className="ml-2 text-xs text-gray-500">
              {new Date(review.createdAt).toLocaleDateString()}
            </span>
          </div>
          {review.comment && (
            <p className="mt-1 text-sm text-gray-600">{review.comment}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default ReviewList;