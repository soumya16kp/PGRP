from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone 
from datetime import timedelta
from account.models import Municipality

class MunicipalityOfficial(models.Model):
   
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="official_profile")
    municipality = models.ForeignKey('account.Municipality', on_delete=models.CASCADE, related_name="officials")
    
    phone = models.CharField(max_length=15, unique=True)
    designation = models.CharField(max_length=100,default="Employee") 
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name} - {self.designation}"


class MunicipalityOTP(models.Model):

    phone = models.CharField(max_length=15)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self):
        # OTP is valid for 5 minutes
        return timezone.now() < self.created_at + timedelta(minutes=5)