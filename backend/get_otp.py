
import os
import django
from django.conf import settings

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from api.models import MunicipalityOTP

def get_latest_otp():
    try:
        latest_otp = MunicipalityOTP.objects.latest('created_at')
        print(f"Latest OTP for {latest_otp.phone}: {latest_otp.otp}")
        print(f"Created at: {latest_otp.created_at}")
    except MunicipalityOTP.DoesNotExist:
        print("No OTPs found in the database.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_latest_otp()
