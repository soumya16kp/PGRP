from rest_framework import generics, permissions
from .models import Profile, Municipality
from .serializers import ProfileSerializer, MunicipalitySerializer
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Avg, F, ExpressionWrapper, DurationField, Q
from django.db.models.functions import TruncMonth
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django.shortcuts import get_object_or_404
from complaints.models import Complaint
from account.models import Municipality
from datetime import datetime
import json
from openai import OpenAI
import os

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


class ProfileDetailView(generics.RetrieveUpdateAPIView):
    
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.profile

    def perform_update(self, serializer):
        try:
            profile = serializer.save()
            if profile.latitude and profile.longitude:
                try:
                    nearest = profile.assign_nearest_municipality()
                    if nearest:
                        profile.municipality = nearest
                        profile.location_verified = True
                        profile.save(update_fields=["municipality", "location_verified"])
                        print("🏙️ Municipality assigned:", nearest.name)
                    else:
                        print("⚠️ No municipality found near given coordinates.")
                except Exception as e:
                    print("❌ Error in assign_nearest_municipality:", e)
            else:
                print("⚠️ Skipping municipality assignment — missing coordinates.")
        except Exception as e:
            print("❌ Error during profile update:", e)
            raise

class NearbyMunicipalitiesView(generics.ListAPIView):
    serializer_class = MunicipalitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        profile = self.request.user.profile

        if not profile.location_verified or not profile.latitude or not profile.longitude:
            print("⚠️ Cannot fetch nearby municipalities — location not verified.")
            return Municipality.objects.none()

        # Call the Profile method that fetches from DB + OSM if needed
        nearby_munis = profile.get_nearby_municipalities(count=6, radius_km=50)

        # TRIGGER AUTO-POPULATION SYNCHRONOUSLY
        import os
        key = os.environ.get("OPENAI_API_KEY")
        print(f"DEBUG: API KEY PRESENT? {'Yes' if key else 'No'}")
        
        # We limit to 3 items to avoid timeout, but this guarantees the UI gets data.
        count = 0
        for muni in nearby_munis:
            if not muni.description and count < 3:
                try:
                    muni.populate_details_from_ai()
                    count += 1
                except Exception as e:
                    print(f"Error executing synchronous AI population for {muni.name}: {e}")

        print(f"✅ Returning {nearby_munis.count()} nearby municipalities")
        return nearby_munis
        
        print(f"✅ Returning {nearby_munis.count()} nearby municipalities")
        return nearby_munis

    def get_serializer_context(self):
        profile = self.request.user.profile
        if profile.latitude and profile.longitude:
            return {"user_coords": (float(profile.latitude), float(profile.longitude))}
        return {}


class MunicipalityDetailView(RetrieveAPIView):
    queryset = Municipality.objects.all()
    serializer_class = MunicipalitySerializer
    permission_classes = [IsAuthenticated]



class MunicipalityDashboardView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, pk):
        municipality = get_object_or_404(Municipality, pk=pk)
        
        # Check if details are missing and fetch from OpenAI if needed
        # Check if details are missing and fetch from OpenAI if needed
        municipality.populate_details_from_ai()

        complaints = Complaint.objects.filter(municipality=municipality)

        total = complaints.count()
        resolved = complaints.filter(status='Resolved').count()
        active = complaints.filter(status__in=['Pending', 'In Progress']).count()

        resolved_qs = complaints.filter(status='Resolved').annotate(
            resolution_time=ExpressionWrapper(
                F('updated_at') - F('created_at'),
                output_field=DurationField()
            )
        )
        avg_time = resolved_qs.aggregate(avg_duration=Avg('resolution_time'))['avg_duration']
        avg_hours = avg_time.total_seconds() / 3600 if avg_time else 0

        # Detailed Department Statistics
        dept_stats_query = complaints.values('department').annotate(
            total=Count('id'),
            resolved_count=Count('id', filter=Q(status='Resolved')),
            pending_count=Count('id', filter=Q(status__in=['Pending', 'In Progress'])),
            avg_resolution_time=Avg(
                ExpressionWrapper(
                    F('updated_at') - F('created_at'),
                    output_field=DurationField()
                ),
                filter=Q(status='Resolved')
            )
        )

        dept_details = {}
        for item in dept_stats_query:
            dept_name = item['department']
            total_dept = item['total']
            resolved_dept = item['resolved_count']
            avg_time_dept = item['avg_resolution_time']
            
            # Calculate metrics
            resolution_rate = round((resolved_dept / total_dept * 100), 1) if total_dept > 0 else 0
            avg_hours_dept = round(avg_time_dept.total_seconds() / 3600, 1) if avg_time_dept else 0

            dept_details[dept_name] = {
                'total': total_dept,
                'resolved': resolved_dept,
                'pending': item['pending_count'],
                'resolution_rate': resolution_rate,
                'avg_response_time': avg_hours_dept
            }

        # Status stats for Pie Chart
        status_stats = complaints.values('status').annotate(count=Count('id'))
        status_dict = {s['status']: s['count'] for s in status_stats}

        # Satisfaction Score
        from review.models import Review
        avg_rating = Review.objects.filter(complaint__municipality=municipality).aggregate(avg=Avg('rating'))['avg']
        satisfaction_score = round((avg_rating / 5) * 100, 1) if avg_rating else 0

        # Monthly Trend with Resolved Count
        monthly_data = (
            complaints.annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(
                total=Count('id'),
                resolved=Count('id', filter=Q(status='Resolved'))
            )
            .order_by('month')
        )
        monthly_trend = [
            {
                'month': d['month'].strftime('%b'),
                'total': d['total'],
                'resolved': d['resolved']
            }
            for d in monthly_data
            if d['month']
        ]

        recent_objs = complaints.order_by('-created_at')
        recent = []
        for c in recent_objs:
            # Calculate priority string based on score
            score = c.score
            if score > 2.0:
                prio = "High"
            elif score > 0.5:
                prio = "Medium"
            else:
                prio = "Low"
            
            recent.append({
                'id': c.id,
                'topic': c.topic,
                'department': c.department,
                'status': c.status,
                'created_at': c.created_at,
                'priority': prio,
                'description': c.description,
                'score': score
            })

        data = {
            'municipality_info': {
                'id': municipality.id,
                'name': municipality.name,
                'district': municipality.district,
                'state': municipality.state,
                # Administrative Details
                'establishment_year': municipality.establishment_year,
                'mayor_name': municipality.mayor_name,
                'commissioner_name': municipality.commissioner_name,
                'wards_count': municipality.wards_count,
                'area_sq_km': municipality.area_sq_km,
                'population': municipality.population,
                'description': municipality.description,
                'latitude': municipality.latitude,
                'longitude': municipality.longitude,
            },
            'total_complaints': total,
            'resolved_complaints': resolved,
            'active_complaints': active,
            'average_resolution_time_hours': round(avg_hours, 2),
            'citizen_satisfaction': satisfaction_score,
            'department_wise_stats': dept_details,  # Now returns detailed object
            'status_distribution': status_dict,
            'monthly_trend': monthly_trend,
            'recent_complaints': list(recent),
        }

        return Response(data)

class MunicipalityRefetchView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        municipality = get_object_or_404(Municipality, pk=pk)
        
        # Backup existing data before clearing
        backup = {
            'description': municipality.description,
            'establishment_year': municipality.establishment_year,
            'mayor_name': municipality.mayor_name,
            'commissioner_name': municipality.commissioner_name,
            'wards_count': municipality.wards_count,
            'area_sq_km': municipality.area_sq_km,
            'population': municipality.population,
        }
        
        try:
            # Clear description to force AI fetch
            municipality.description = None
            municipality.save(update_fields=['description'])
            
            # Now call populate
            municipality.populate_details_from_ai()
            
            # Reload from DB
            municipality.refresh_from_db()
            
            # Check if it actually worked
            if not municipality.description or len(str(municipality.description).strip()) == 0:
                # Restore backup
                print(f"⚠️ AI fetch returned empty for {municipality.name}, restoring backup")
                for key, value in backup.items():
                    setattr(municipality, key, value)
                municipality.save()
                return Response({"error": "AI fetch returned empty data. Original data restored."}, status=500)
            
            return Response({
                "message": "Data refetched successfully",
                "data": MunicipalitySerializer(municipality).data
            })
        except Exception as e:
            # Restore backup on any error
            print(f"❌ Refetch failed for {municipality.name}: {e}, restoring backup")
            for key, value in backup.items():
                setattr(municipality, key, value)
            municipality.save()
            return Response({"error": str(e)}, status=500)
