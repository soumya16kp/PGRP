
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from django.contrib.auth.models import User

def fix_user():
    email = "worker@gmail.com"
    try:
        user = User.objects.get(email=email)
        user.is_staff = True
        user.save()
        print(f"Successfully set is_staff=True for {user.username} ({user.email})")
            
    except User.DoesNotExist:
        print(f"User with email {email} not found.")

if __name__ == "__main__":
    fix_user()
