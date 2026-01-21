from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ComplaintViewSet, MunicipalityComplaintsView,RankedComplaintListView,update_complaint_status

router = DefaultRouter()
router.register(r'complaints', ComplaintViewSet, basename='complaint')

urlpatterns = [
        path(
        'complaints/update-status/',
        update_complaint_status,
        name='update-complaint-status'
    ),
    path('municipalities/<int:pk>/complaints/', MunicipalityComplaintsView.as_view(), name='municipality-complaints'),
    path('complaints/ranked/', RankedComplaintListView.as_view(), name='ranked-complaints'),
    path('', include(router.urls)),
]
