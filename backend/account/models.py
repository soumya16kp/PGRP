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
    
    # Administrative Details
    establishment_year = models.IntegerField(null=True, blank=True)
    mayor_name = models.CharField(max_length=150, null=True, blank=True)
    commissioner_name = models.CharField(max_length=150, null=True, blank=True) # Executive Officer
    wards_count = models.IntegerField(null=True, blank=True)
    area_sq_km = models.FloatField(null=True, blank=True)
    population = models.IntegerField(null=True, blank=True) # Latest Census/Estimate
    description = models.TextField(null=True, blank=True) # Introduction/Bio

    def __str__(self):
        return f"{self.name}, {self.district}"

    def populate_details_from_ai(self):
        """
        Fetches administrative details from OpenAI if description is missing.
        """
        import json
        import os
        from openai import OpenAI
        
        # Check if description has actual content (not just empty string or None)
        if self.description and len(self.description.strip()) > 0:
            print(f"ℹ️ {self.name} already has description, skipping AI fetch.")
            return  # Already populated

        client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        
        if not client.api_key:
            print(f"❌ No OPENAI_API_KEY found for {self.name}")
            return

        try:
            print(f"🤖 Fetching administrative details for {self.name}...")
            prompt = f"""
            Provide administrative details for the municipality of '{self.name}' in '{self.district}', '{self.state}' (India).
            Return ONLY a valid JSON object with these keys (use null if unknown, estimate if reasonable):
            - "establishment_year" (integer)
            - "mayor_name" (string)
            - "commissioner_name" (string)
            - "wards_count" (integer)
            - "area_sq_km" (float)
            - "population" (integer, latest census/estimate)
            - "description" (string, 2 sentences intro)
            """
            
            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a city data assistant. Output JSON only."},
                    {"role": "user", "content": prompt}
                ]
            )
            
            content = completion.choices[0].message.content.strip()
            print(f"📦 Raw response for {self.name}: {content[:100]}...")
            
            if content.startswith("```"):
                content = content.replace("```json", "").replace("```", "").strip()
            
            data_json = json.loads(content)
            
            # DEBUG: Print the FULL parsed data
            print(f"📊 PARSED DATA for {self.name}:")
            print(f"   establishment_year: {data_json.get('establishment_year')}")
            print(f"   mayor_name: {data_json.get('mayor_name')}")
            print(f"   commissioner_name: {data_json.get('commissioner_name')}")
            print(f"   wards_count: {data_json.get('wards_count')}")
            print(f"   area_sq_km: {data_json.get('area_sq_km')}")
            print(f"   population: {data_json.get('population')}")
            print(f"   description: {data_json.get('description')}")
            
            self.establishment_year = data_json.get('establishment_year')
            self.mayor_name = data_json.get('mayor_name')
            self.commissioner_name = data_json.get('commissioner_name')
            self.wards_count = data_json.get('wards_count')
            self.area_sq_km = data_json.get('area_sq_km')
            self.population = data_json.get('population')
            
            # Ensure description is not None/empty
            desc = data_json.get('description')
            if desc and len(str(desc).strip()) > 0:
                self.description = desc
            else:
                self.description = f"{self.name} is a municipality in {self.district}, {self.state}."
            
            self.save()
            print(f"✅ Updated details for {self.name}")
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON parse error for {self.name}: {e}")
            print(f"   Raw content was: {content[:200] if 'content' in dir() else 'N/A'}")
        except Exception as e:
            print(f"❌ Error fetching municipality details for {self.name}: {e}")


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
    honesty_score = models.IntegerField(default=100)

    municipality = models.ForeignKey(
        Municipality, on_delete=models.SET_NULL, null=True, blank=True, related_name="residents"
    )

    def __str__(self):
        return self.user.username



    def assign_nearest_municipality(self):
    
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

        if len(nearby) < count:
            print("📡 Fetching additional municipalities from Overpass API (OSM)...")
            
            # Initialize geolocator for reverse geocoding
            geolocator = Nominatim(user_agent="geoapiSoumya")
            
            overpass_url = "https://overpass-api.de/api/interpreter"
            radius_meters = 50000  # 50km
            
            # Query for nodes tagged as city/town/suburb or boundary=administrative with admin_level 8 (municipality)
            # This is much more reliable than text search
            overpass_query = f"""
            [out:json][timeout:25];
            (
              node["place"~"city|town"](around:{radius_meters},{self.latitude},{self.longitude});
              relation["boundary"="administrative"]["admin_level"~"4|5|6|7|8"](around:{radius_meters},{self.latitude},{self.longitude});
            );
            out center;
            """
            
            try:
                response = requests.get(overpass_url, params={'data': overpass_query}, headers={"User-Agent": "EcoCity-App/1.0"})
                response.raise_for_status()
                data = response.json()
                elements = data.get("elements", [])
                
                print(f"🌍 Overpass returned {len(elements)} raw elements")

                for res in elements:
                    try:
                        tags = res.get("tags", {})
                        name = tags.get("name", "")
                        
                        if not name:
                            continue
                            
                        # English name preference
                        if "name:en" in tags:
                            name = tags["name:en"]

                        # Filtering common noise
                        if not name or "District" in name or "State" in name:
                             # Cuttack District vs Cuttack City. We want the city.
                             if "District" in name:
                                 continue

                        # Extract coordinates
                        lat, lon = None, None
                        if res["type"] == "node":
                            lat, lon = res["lat"], res["lon"]
                        elif res["type"] == "relation" and "center" in res:
                             lat, lon = res["center"]["lat"], res["center"]["lon"]
                        
                        if lat is None or lon is None:
                            continue
                            
                        # Avoid duplicates
                        if not Municipality.objects.filter(name__iexact=name).exists():
                            # Use reverse geocoding to get accurate district/state
                            district = "Unknown District"
                            state = "Unknown State"
                            
                            try:
                                location = geolocator.reverse((lat, lon), exactly_one=True, language="en")
                                if location:
                                    address = location.raw.get("address", {})
                                    district = address.get("county") or address.get("state_district") or "Unknown District"
                                    state = address.get("state") or "Unknown State"
                            except Exception as e:
                                print(f"⚠️ Reverse geocoding failed for {name}: {e}")
                            
                            muni = Municipality.objects.create(
                                name=name,
                                district=district,
                                state=state,
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
                        print(f"⚠️ Error processing Overpass element {res.get('id')}: {e}")
                        
            except Exception as e:
                print("⚠️ Overpass API fetch failed:", e)


        sorted_nearby = sorted(nearby, key=lambda x: x[1])
        top_nearby = [m for m, _ in sorted_nearby[:count]]

        return Municipality.objects.filter(id__in=[m.id for m in top_nearby ])
