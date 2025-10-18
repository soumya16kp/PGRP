from rest_framework import serializers
from geopy.distance import distance
from django.contrib.auth.models import User
from .models import Profile,Municipality

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]

class ProfileSerializer(serializers.ModelSerializer):
    municipality_name = serializers.CharField(source="municipality.name", read_only=True)
    user = UserSerializer(read_only=True)
    latitude = serializers.DecimalField(max_digits=12, decimal_places=10, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=12, decimal_places=10, required=False, allow_null=True)


    class Meta:
        model = Profile
        fields = ["id", "user", "bio", "phone", "designation", "profile_image","latitude","longitude","municipality_name","municipality"]
        read_only_fields=["municipality_name "]

class MunicipalitySerializer(serializers.ModelSerializer):
    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = Municipality
        fields = ["id", "name", "district", "state", "latitude", "longitude", "distance_km"]

    def get_distance_km(self, obj):
        user_coords = self.context.get("user_coords")
        if user_coords:
            muni_coords = (float(obj.latitude), float(obj.longitude))
            return round(distance(user_coords, muni_coords).km, 2)
        return None