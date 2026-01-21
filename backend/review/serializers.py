from rest_framework import serializers
from .models import Review
from complaints.models import Complaint

# 1. Standard Serializer for the Review itself
class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['id', 'rating', 'feedback', 'created_at']

# 2. Serializer for Complaint that includes the nested Review
class ComplaintWithReviewStatusSerializer(serializers.ModelSerializer):
    # This fetches the related review object using the related_name="review"
    review = ReviewSerializer(read_only=True)

    class Meta:
        model = Complaint
        fields = [
            'id', 
            'topic', 
            'description', 
            'status', 
            'created_at', 
            'review' # This will be null if no review exists, or an object if it does
        ]