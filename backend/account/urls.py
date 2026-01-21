from django.urls import path
from .views import ProfileDetailView, NearbyMunicipalitiesView,MunicipalityDetailView,MunicipalityDashboardView,MunicipalityRefetchView

urlpatterns = [
    path("profile/", ProfileDetailView.as_view(), name="user-profile"),
    path("municipalities/nearby/", NearbyMunicipalitiesView.as_view(), name="nearby-municipalities"),
    path('municipalities/<int:pk>/', MunicipalityDetailView.as_view(), name='municipality-detail'),
    path('municipalities/<int:pk>/dashboard/', MunicipalityDashboardView.as_view(), name='municipality-dashboard'),
    path('municipalities/<int:pk>/refetch/', MunicipalityRefetchView.as_view(), name='municipality-refetch'),
]
 