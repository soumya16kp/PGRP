
import os
import django
from django.conf import settings

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from api.models import MunicipalityOTP

def get_latest_otp():
    otps = MunicipalityOTP.objects.order_by('-created_at')[:5]
    with open('otp_log.txt', 'w') as f:
        if not otps:
            f.write("No OTPs found.")
            return

        for otp_obj in otps:
            f.write(f"ID: {otp_obj.id} | Phone: {otp_obj.phone} | OTP: '{otp_obj.otp}' | Created: {otp_obj.created_at}\n")

if __name__ == "__main__":
    get_latest_otp()
