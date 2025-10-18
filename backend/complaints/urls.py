from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ComplaintViewSet, MunicipalityComplaintsView

router = DefaultRouter()
router.register(r'complaints', ComplaintViewSet, basename='complaint')

urlpatterns = [
    path('municipalities/<int:pk>/complaints/', MunicipalityComplaintsView.as_view(), name='municipality-complaints'),
    path('', include(router.urls)),
]
