# users/urls.py
from django.urls import path
from .views import signup_view, login_view, logout_view, protected_view

urlpatterns = [
    path('signup/', signup_view, name='signup'),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('protected/', protected_view, name='protected'),
]
