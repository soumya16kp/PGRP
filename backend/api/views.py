# users/views.py
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import MunicipalityOfficial,MunicipalityOTP
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
import random
from .utils import send_fast2sms_otp
from .serializers import UserSignupSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def signup_view(request):
    serializer = UserSignupSerializer(data=request.data)
    if serializer.is_valid():
        # Save new user
        user = serializer.save()

        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            "message": "User created successfully",
            "token": token.key,        
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            }
        }, status=status.HTTP_201_CREATED)

    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    
    identifier = request.data.get('username')
    password = request.data.get('password')
    print(request.data.get('password'),request.data.get('username'))
    if not identifier or not password:
        return Response({'error': 'Please provide both username/email and password'}, status=status.HTTP_400_BAD_REQUEST)

    user = None
    user = authenticate(username=identifier, password=password)

    if user is None:
        try:
        
            found_user = User.objects.get(email__iexact=identifier)
           
            user = authenticate(username=found_user.username, password=password)
        except User.DoesNotExist:
          
            pass 
    

    if user:
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key}, status=status.HTTP_200_OK)

    return Response({'error': 'Invalid Credentials'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        request.user.auth_token.delete()
        return Response({'message': 'Successfully logged out.'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def protected_view(request):
    # This view is protected, only accessible with a valid token
    print("this is user ",request.user)
    user = request.user
    
    response_data = {
        'message': f'Hello, {user.username}! This is a protected view.',
        'user_details': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff
        }
    }

    # Add municipality details if user is an official
    # Add municipality details if user is an official
    if user.is_staff:
        try:
            official = MunicipalityOfficial.objects.get(user=user)
            response_data['user_details']['municipality'] = {
                'id': official.municipality.id,
                'name': official.municipality.name
            }
            response_data['user_details']['designation'] = official.designation
            response_data['user_details']['profile_image'] = official.user.official_profile.user.profile_image.url if hasattr(official.user, 'profile_image') and official.user.profile_image else None
        except MunicipalityOfficial.DoesNotExist:
            pass
    # Add municipality details for citizens
    elif hasattr(user, 'profile') and user.profile.municipality:
         response_data['user_details']['municipality'] = {
            'id': user.profile.municipality.id,
            'name': user.profile.municipality.name
        }

    return Response(response_data)

@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp_view(request):

    email = request.data.get("email")
    phone = request.data.get("phone")
    password = request.data.get("password")

    if not email or not phone or not password:
        return Response({"error": "Email, Phone, and Password are required"}, status=400)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "Invalid credentials (User not found)"}, status=401)

    if not user.check_password(password):
         return Response({"error": "Invalid password"}, status=401)

    try:
        official_profile = user.official_profile 
    except Exception:
        return Response({"error": "This user is not a Municipality Official"}, status=403)

    if official_profile.phone != phone:
        return Response({"error": "Phone number does not match our records"}, status=401)
    
    otp = str(random.randint(100000, 999999))
    MunicipalityOTP.objects.create(phone=phone, otp=otp)
    # try:
    #     send_fast2sms_otp(phone, otp)
    # except Exception as e:
    #     # We catch errors so the frontend still gets a success message 
    #     # (useful if you are testing locally without internet or credits)
    #     print(f"Failed to send SMS: {e}")

    
    # # Log to console for development convenience
    print(f"DEBUG OTP for {phone}: {otp}") 

    return Response({"message": "Credentials verified. OTP sent successfully."})


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp_view(request):
    phone = request.data.get("phone")
    otp = request.data.get("otp")

    if not phone or not otp:
        return Response({"error": "Phone and OTP required"}, status=400)

    try:
        otp_obj = MunicipalityOTP.objects.filter(phone=phone).latest('created_at')
    except MunicipalityOTP.DoesNotExist:
        return Response({"error": "No OTP found for this number. Please generate one first."}, status=404)

    if otp_obj.otp != otp:
        return Response({"error": "Invalid OTP"}, status=400)

    if not otp_obj.is_valid():
        return Response({"error": "OTP has expired"}, status=400)

    try:
        official = MunicipalityOfficial.objects.get(phone=phone)
    except MunicipalityOfficial.DoesNotExist:
        return Response({"error": "Official account not found"}, status=404)

    token, _ = Token.objects.get_or_create(user=official.user)
    municipality_id = official.municipality.id if official.municipality else None
    municipality_name = official.municipality.name if official.municipality else None

    otp_obj.delete()

    return Response({
        "message": "Login successful",
        "token": token.key,
        "municipality_id": municipality_id,
        "official": {
            "name": official.user.get_full_name(),
            "email": official.user.email,
            "phone": official.phone,
            "designation": official.designation,
            "municipality": municipality_id,  # Changed to ID to match protected_view
            "municipality_name": municipality_name, 
            "municipality_id": municipality_id,
            "is_staff": official.user.is_staff # Added is_staff
        }
    })