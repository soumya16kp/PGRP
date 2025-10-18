from rest_framework import generics, permissions
from .models import Profile, Municipality
from .serializers import ProfileSerializer, MunicipalitySerializer
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Avg, F, ExpressionWrapper, DurationField
from django.db.models.functions import TruncMonth
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django.shortcuts import get_object_or_404
from complaints.models import Complaint
from account.models import Municipality
from datetime import datetime


class ProfileDetailView(generics.RetrieveUpdateAPIView):
    """
    Allows the logged-in user to retrieve or update their own profile.
    Automatically assigns the nearest municipality based on latitude/longitude.
    """
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
        nearby_munis = profile.get_nearby_municipalities(count=6, radius_km=200)

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
        complaints = Complaint.objects.filter(municipality=municipality)

        total = complaints.count()
        resolved = complaints.filter(status='Resolved').count()
        active = complaints.filter(status__in=['Pending', 'In Progress']).count()

        # Average resolution time (in hours)
        resolved_qs = complaints.filter(status='Resolved').annotate(
            resolution_time=ExpressionWrapper(
                F('updated_at') - F('created_at'),
                output_field=DurationField()
            )
        )
        avg_time = resolved_qs.aggregate(avg_duration=Avg('resolution_time'))['avg_duration']
        avg_hours = avg_time.total_seconds() / 3600 if avg_time else 0

        # Department-wise stats
        dept_stats = complaints.values('department').annotate(count=Count('id'))
        dept_dict = {d['department']: d['count'] for d in dept_stats}

        # Status distribution
        status_stats = complaints.values('status').annotate(count=Count('id'))
        status_dict = {s['status']: s['count'] for s in status_stats}

        # Monthly trend (group by month)
        monthly_data = (
            complaints.annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(total=Count('id'))
            .order_by('month')
        )
        monthly_trend = [
            {
                'month': d['month'].strftime('%b %Y'),
                'total': d['total']
            }
            for d in monthly_data
            if d['month']
        ]

        # Recent complaints (last 5)
        recent = complaints.order_by('-created_at')[:5].values(
            'topic', 'department', 'status', 'created_at'
        )

        data = {
            'municipality_info': {
                'id': municipality.id,
                'name': municipality.name,
                'district': municipality.district,
                'state': municipality.state,
            },
            'total_complaints': total,
            'resolved_complaints': resolved,
            'active_complaints': active,
            'average_resolution_time_hours': round(avg_hours, 2),
            'department_wise_stats': dept_dict,
            'status_distribution': status_dict,
            'monthly_trend': monthly_trend,
            'recent_complaints': list(recent),
        }

        return Response(data)
