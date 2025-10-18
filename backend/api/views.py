# users/views.py
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

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
            "token": token.key,          # 👈 return token directly
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
          
            pass # We'll fail to the final check below.
    

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
    return Response({
        'message': f'Hello, {user.username}! This is a protected view.',
        'user_details': {
            'id': user.id,
            'username': user.username,
            'email': user.email
        }
    })