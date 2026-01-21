from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    # path('api/clubs/',include('clubs.urls')),
    path("api/", include("complaints.urls")),
    path('api/', include('account.urls')),
    # path('api/', include("members.urls")),
    path("api/reviews/", include("review.urls")),
    
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)