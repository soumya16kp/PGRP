from django.db import models
import requests
from django.contrib.auth.models import User
from geopy.distance import distance  
from geopy.geocoders import Nominatim

class Municipality(models.Model):
 
    name = models.CharField(max_length=150)
    district = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    latitude = models.DecimalField(max_digits=20, decimal_places=15, null=True, blank=True)
    longitude = models.DecimalField(max_digits=20, decimal_places=15, null=True, blank=True)
    verified = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name}, {self.district}"


class Profile(models.Model):
   
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    bio = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    designation = models.CharField(max_length=100, blank=True, null=True)
    profile_image = models.ImageField(upload_to="profile_images/", blank=True, null=True)

    address = models.CharField(max_length=255, blank=True, null=True)
    pincode = models.CharField(max_length=10, blank=True, null=True)
    latitude = models.DecimalField(max_digits=20, decimal_places=15, null=True, blank=True)
    longitude = models.DecimalField(max_digits=20, decimal_places=15, null=True, blank=True)
    location_verified = models.BooleanField(default=False)

    municipality = models.ForeignKey(
        Municipality, on_delete=models.SET_NULL, null=True, blank=True, related_name="residents"
    )

    def __str__(self):
        return self.user.username



    def assign_nearest_municipality(self):
        """Reverse geocode user's coordinates and assign or create a municipality."""
        if not (self.latitude and self.longitude):
            print("No coordinates, skipping municipality assignment")
            return None

        user_coords = (float(self.latitude), float(self.longitude))
        geolocator = Nominatim(user_agent="geoapiSoumya")

        try:
            location = geolocator.reverse(user_coords, exactly_one=True, language="en")
            if not location:
                print("Could not reverse geocode coordinates")
                return None

            address = location.raw.get("address", {})
            name = address.get("city") or address.get("town") or address.get("village") or address.get("municipality") or "Unknown"
            district = address.get("county") or address.get("state_district") or "Unknown"
            state = address.get("state") or "Unknown"

            # Check if this municipality already exists
            municipality, created = Municipality.objects.get_or_create(
                name=name,
                district=district,
                state=state,
                defaults={
                    "latitude": self.latitude,
                    "longitude": self.longitude,
                    "verified": True
                }
            )

            print("Municipality found/created:", municipality, "Created new?" , created)
            self.municipality = municipality
            self.location_verified = True

            return municipality

        except Exception as e:
            print("Reverse geocoding error:", e)
            return None
        
    def get_nearby_municipalities(self, count=5, radius_km=100):
        if not self.location_verified or not self.latitude or not self.longitude:
            return Municipality.objects.none()

        user_coords = (float(self.latitude), float(self.longitude))
        nearby = []

        db_municipalities = Municipality.objects.exclude(latitude__isnull=True, longitude__isnull=True)
        for m in db_municipalities:
            try:
                lat = float(m.latitude)
                lon = float(m.longitude)
                dist = distance(user_coords, (lat, lon)).km
                if dist <= radius_km:
                    nearby.append((m, dist))
            except (TypeError, ValueError):
                print(f"⚠️ Skipping municipality with invalid coordinates: {m.name}")

        # 2️⃣ Fetch additional from OSM if needed
        if len(nearby) < count:
            print("📡 Fetching additional municipalities from OpenStreetMap...")
            url = "https://nominatim.openstreetmap.org/search"
            radius_deg = 0.5  # about 50 km

            params = {
                "q": "municipality",
                "format": "json",
                "limit": count * 4,
                "extratags": 1,
                "addressdetails": 1,
                "countrycodes": "IN",
                "viewbox": f"{float(self.longitude)-radius_deg},{float(self.latitude)+radius_deg},"
                        f"{float(self.longitude)+radius_deg},{float(self.latitude)-radius_deg}",
                "bounded": 1,
            }
            try:
                response = requests.get(url, params=params, headers={"User-Agent": "myapp"})
                response.raise_for_status()
                results = response.json()

                for res in results:
                    try:
                        name = res.get("display_name", "").split(",")[0]
                        lat = float(res["lat"])
                        lon = float(res["lon"])
                        if not Municipality.objects.filter(name=name).exists():
                            muni = Municipality.objects.create(
                                name=name,
                                district=res.get("address", {}).get("county", ""),
                                state=res.get("address", {}).get("state", ""),
                                latitude=lat,
                                longitude=lon,
                                verified=False
                            )
                            dist = distance(user_coords, (lat, lon)).km
                            if dist <= radius_km:
                                nearby.append((muni, dist))
                        if len(nearby) >= count:
                            break
                    except Exception as e:
                        print("⚠️ Error processing OSM result:", e)
            except Exception as e:
                print("⚠️ OSM fetch failed:", e)

        # 3️⃣ Sort and return top `count`
        sorted_nearby = sorted(nearby, key=lambda x: x[1])
        top_nearby = [m for m, _ in sorted_nearby[:count]]

        return Municipality.objects.filter(id__in=[m.id for m in top_nearby ])
