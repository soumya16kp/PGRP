from django.urls import path
from .views import CreateReviewView, UserComplaintsForReviewView

urlpatterns = [
    path('create/', CreateReviewView.as_view(), name="review-create"),
    path('my-complaints/', UserComplaintsForReviewView.as_view(), name='my-complaints-status'),
]
