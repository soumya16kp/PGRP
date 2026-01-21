from rest_framework import serializers
from geopy.distance import distance
from django.contrib.auth.models import User
from .models import Profile,Municipality

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "is_staff"]

class ProfileSerializer(serializers.ModelSerializer):
    municipality_name = serializers.CharField(source="municipality.name", read_only=True)
    user = UserSerializer(read_only=True)
    latitude = serializers.DecimalField(max_digits=12, decimal_places=10, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=12, decimal_places=10, required=False, allow_null=True)
    
    # Flattened fields for frontend convenience
    is_staff = serializers.BooleanField(source="user.is_staff", read_only=True)
    official_municipality = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ["id", "user", "bio", "phone", "designation", "profile_image","latitude","longitude","municipality_name","municipality", "is_staff", "official_municipality", "honesty_score"]
        read_only_fields=["municipality_name "]

    def get_official_municipality(self, obj):
        # If the user is staff, try to get their assigned municipality ID
        if obj.user.is_staff:
            try:
                # Access the reverse relationship from User to MunicipalityOfficial
                # Assuming related_name='official_profile' in MunicipalityOfficial model
                return obj.user.official_profile.municipality.id
            except Exception:
                return None
        return None

class MunicipalitySerializer(serializers.ModelSerializer):
    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = Municipality
        fields = [
            "id", "name", "district", "state", "latitude", "longitude", "distance_km",
            "establishment_year", "mayor_name", "commissioner_name", 
            "wards_count", "area_sq_km", "population", "description"
        ]

    def get_distance_km(self, obj):
        user_coords = self.context.get("user_coords")
        if user_coords:
            muni_coords = (float(obj.latitude), float(obj.longitude))
            return round(distance(user_coords, muni_coords).km, 2)
        return None