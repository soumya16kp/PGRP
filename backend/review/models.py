from django.db import models
from django.contrib.auth.models import User
from account.models import Profile
from complaints.models import Complaint

class Review(models.Model):
    complaint = models.OneToOneField(Complaint, on_delete=models.CASCADE, related_name="review")
    user = models.ForeignKey(Profile, on_delete=models.CASCADE)
    rating = models.IntegerField(default=5)
    feedback = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return f"Review for {self.complaint.topic} by {self.user.user.username}"

