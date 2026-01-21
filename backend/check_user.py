
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from django.contrib.auth.models import User
from api.models import MunicipalityOfficial

def check_user():
    email = "worker@gmail.com"
    try:
        user = User.objects.get(email=email)
        print(f"User: {user.username}")
        print(f"Email: {user.email}")
        print(f"is_staff: {user.is_staff}")
        
        try:
            official = MunicipalityOfficial.objects.get(user=user)
            print(f"Official Profile Found: {official}")
            print(f"Municipality: {official.municipality.name} (ID: {official.municipality.id})")
        except MunicipalityOfficial.DoesNotExist:
            print("No MunicipalityOfficial profile found!")
            
    except User.DoesNotExist:
        print(f"User with email {email} not found.")

if __name__ == "__main__":
    check_user()
