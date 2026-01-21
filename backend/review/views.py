from rest_framework import generics, permissions
from rest_framework.exceptions import ValidationError
from .models import Review
from complaints.models import Complaint
from .serializers import ReviewSerializer
from .serializers import ComplaintWithReviewStatusSerializer


class CreateReviewView(generics.CreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        complaint_id = self.request.data.get("complaint")

        if not complaint_id:
            raise ValidationError("Complaint ID is required.")

        complaint = Complaint.objects.get(id=complaint_id)

        # Check if this complaint belongs to current user
        if complaint.user != self.request.user:
            raise ValidationError("You cannot review someone else's complaint.")

        # Must be resolved
        if complaint.status != "Resolved":
            raise ValidationError("Complaint must be resolved before giving feedback.")

        # Prevent duplicate review
        if hasattr(complaint, "review"):
            raise ValidationError("Review already submitted.")

        serializer.save(user=self.request.user.profile,complaint=complaint)
                      


class MyReviewsView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Review.objects.filter(user=self.request.user.profile)
        print("REVIEWS SENT TO FRONTEND:", qs.values())  
        return qs


class UserComplaintsForReviewView(generics.ListAPIView):

    serializer_class = ComplaintWithReviewStatusSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filter complaints by the logged-in user
        # Note: Assuming Complaint model has a 'user' field linking to auth.User
        return Complaint.objects.filter(user=self.request.user).order_by('-created_at')