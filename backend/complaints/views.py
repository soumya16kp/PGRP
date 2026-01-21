import os
import json
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework import generics
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Complaint, Comment,ComplaintActivity
from account.models import Municipality
from django.shortcuts import render,get_object_or_404
from .serializers import ComplaintSerializer, CommentSerializer,RankedComplaintSerializer
from openai import OpenAI
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from api.models import MunicipalityOfficial
import math
import difflib

# Helper function for Haversine distance
def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = (math.sin(dLat / 2) * math.sin(dLat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dLon / 2) * math.sin(dLon / 2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class MunicipalityComplaintsView(generics.ListAPIView):
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        municipality_id = self.kwargs['pk']
        return Complaint.objects.filter(municipality_id=municipality_id).order_by('-created_at')
class ComplaintViewSet(viewsets.ModelViewSet):
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Complaint.objects.all().order_by('-created_at')
        municipality_id = self.request.query_params.get('municipality_id')
        if municipality_id:
            queryset = queryset.filter(municipality_id=municipality_id)
        return queryset

    def perform_create(self, serializer):
        user_profile = self.request.user.profile
        
        # 🚫 Block if honesty score is too low
        if user_profile.honesty_score < 30:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"error": "Your honesty score is too low to submit complaints. Please contact support."})

        municipality_id = self.request.data.get('municipality_id')
        municipality = None
        if municipality_id:
            municipality = get_object_or_404(Municipality, id=municipality_id)

        description = self.request.data.get('description', '')

        # 🔹 Call the AI to get priority
        priority = 0.5  # default
        if description:
            try:
                prompt = f"""
                You are a municipal issue prioritization assistant.
                Given this citizen complaint description, output ONLY a float between 0 and 1
                representing the urgency or severity (0 = trivial/spam, 1 = extremely urgent).
                
                Complaint: "{description}"

                Output only the number. No explanation.
                """
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You output only a float between 0 and 1."},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.2,
                )
                text = response.choices[0].message.content.strip()
                priority = float(text)
                priority = max(0, min(priority, 1))
            except Exception:
                priority = 0.5

        # 📉 Reject & Penalize if priority is too low (Spam/Trivial)
        if priority < 0.2:
            user_profile.honesty_score -= 10
            user_profile.save()
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"error": f"Complaint rejected due to low urgency score ({priority}). Your integrity score has been penalized."})

        serializer.save(user=self.request.user, municipality=municipality, priority=priority)

    def partial_update(self, request, *args, **kwargs):
        """
        Override to restrict status updates to staff or municipality officials.
        """
        complaint = self.get_object()
        
        # Check if status is being changed
        if 'status' in request.data:
            # Check permissions: Staff OR Municipality Official for this municipality
            is_staff = request.user.is_staff
            is_official = False
            official_profile = None

            try:
                official_profile = request.user.official_profile
                if official_profile.municipality == complaint.municipality:
                    is_official = True
            except Exception:
                pass

            if not (is_staff or is_official):
                 return Response(
                    {'error': 'Only municipality officials or staff can update complaint status.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Log the activity if status is changing
            new_status = request.data.get('status')
            if complaint.status != new_status:
                try:
                    # Only log if there is an official profile (or update model to allow null)
                    # For now, we only log if official_profile exists to avoid errors
                    if official_profile:
                        ComplaintActivity.objects.create(
                            complaint=complaint,
                            updated_by=official_profile,
                            previous_status=complaint.status,
                            new_status=new_status,
                            remarks=request.data.get('remarks', '')
                        )
                except Exception as e:
                    print(f"Could not log activity: {e}")
        
        return super().partial_update(request, *args, **kwargs)

    # 🔹 POST /api/complaints/<id>/upvote/
    @action(detail=True, methods=['post'])
    def upvote(self, request, pk=None):
        complaint = self.get_object()
        user = request.user

        if user in complaint.upvotes.all():
            complaint.upvotes.remove(user)
            message = "Upvote removed"
        else:
            complaint.upvotes.add(user)
            message = "Upvoted"

        return Response({
            'message': message,
            'total_upvotes': complaint.total_upvotes()
        })

    # 🔹 POST /api/complaints/<id>/comments/
    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        complaint = self.get_object()
        serializer = CommentSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(user=request.user, complaint=complaint)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        complaint = self.get_object()
        comments = complaint.comments.all().order_by('-created_at')
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)

    # 🔹 POST /api/complaints/check_similar/
    @action(detail=False, methods=['post'])
    def check_similar(self, request):
        data = request.data
        lat = float(data.get('latitude'))
        lon = float(data.get('longitude'))
        description = data.get('description', '')
        municipality_id = data.get('municipality_id')

        if not lat or not lon or not municipality_id:
            return Response({'error': 'Missing location or municipality data'}, status=400)

        # 1. Fetch complaints within 1km radius
        recent_complaints = Complaint.objects.filter(
            municipality_id=municipality_id
        ).exclude(status__in=['Resolved', 'Rejected']) # Only active complaints

        nearby_complaints = []
        for c in recent_complaints:
            dist = calculate_distance(lat, lon, float(c.latitude), float(c.longitude))
            if dist <= 1.0: # 1km radius
                nearby_complaints.append(c)

        if not nearby_complaints:
            return Response({'similar_complaints': []})

        # 2. Check Text Similarity
        similar_complaints = []
        
        # Method A: Gen AI Check (if key exists)
        if client.api_key and len(nearby_complaints) > 0 and description:
            try:
                # Prepare context for AI
                candidates = "\n".join([f"ID {c.id}: {c.topic}: {c.description}" for c in nearby_complaints[:5]])
                prompt = f"""
                I have a new complaint: "{description}"
                
                Here are existing nearby complaints:
                {candidates}
                
                Identify which of the existing complaints are semantically similar to the new one.
                Return ONLY a JSON array of IDs of the similar complaints. If none, return [].
                Example output: [12, 15] or []
                """
                
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a duplicate detection system. Output only JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.0
                )
                
                content = response.choices[0].message.content.strip()
                # Clean up potential markdown formatting like ```json ... ```
                if content.startswith("```"):
                    content = content.replace("```json", "").replace("```", "")
                
                similar_ids = json.loads(content)
                similar_complaints = [c for c in nearby_complaints if c.id in similar_ids]
                
            except Exception as e:
                print(f"AI Check failed: {e}")
                # Fallback to manual check will happen if list is empty, or we can just pass
                pass

        # Method B: Fallback (SequenceMatcher) if AI failed or returned nothing (but let's merge results if needed, simple overwrite for now)
        if not similar_complaints and description:
            for c in nearby_complaints:
                seq = difflib.SequenceMatcher(None, description.lower(), c.description.lower())
                if seq.ratio() > 0.4: # Low threshold for fuzzy match
                    similar_complaints.append(c)

        serializer = ComplaintSerializer(similar_complaints, many=True, context={'request': request})
        return Response({'similar_complaints': serializer.data})

class RankedComplaintListView(APIView):

    def get(self, request):
        municipality_id = request.query_params.get('municipality_id')
        all_complaints = Complaint.objects.ranked(municipality_id=municipality_id)
        page = int(request.query_params.get('page', 1))
        per_page = 8
        start = (page - 1) * per_page
        end = start + per_page
        paginated = all_complaints[start:end]

        serializer = RankedComplaintSerializer(paginated, many=True)

        # 4️⃣ Return paginated response
        return Response({
            "page": page,
            "total": len(all_complaints),
            "count": len(paginated),
            "results": serializer.data
        }, status=status.HTTP_200_OK)
    



# --- Custom Decorator ---
def municipality_official_required(view_func):
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        if not hasattr(request.user, 'official_profile'):
            return JsonResponse({'error': 'Access Denied: Not a Municipality Official'}, status=403)
        return view_func(request, *args, **kwargs)
    return wrapper


@login_required
@municipality_official_required
def official_dashboard(request):

    official = request.user.official_profile
    
    complaints = Complaint.objects.filter(
        municipality=official.municipality
    ).select_related('user').order_by('-created_at')

    context = {
        'official': official,
        'complaints': complaints,
        'status_choices': Complaint.STATUS_CHOICES
    }
    return render(request, 'official/dashboard.html', context)


@require_POST
@login_required
@municipality_official_required
def update_complaint_status(request):
    """
    Updates the status and logs the activity.
    """
    try:
        data = json.loads(request.body)
        complaint_id = data.get('complaint_id')
        new_status = data.get('status')
        remarks = data.get('remarks', '') 

        official = request.user.official_profile
        
        complaint = get_object_or_404(Complaint, id=complaint_id, municipality=official.municipality)

        if complaint.status == new_status:
             return JsonResponse({'success': False, 'message': 'Status is already set to this value.'})


        ComplaintActivity.objects.create(
            complaint=complaint,
            updated_by=official,
            previous_status=complaint.status,
            new_status=new_status,
            remarks=remarks
        )

        # 3. Update the Actual Complaint
        complaint.status = new_status
        complaint.save()

        return JsonResponse({
            'success': True, 
            'message': 'Status updated successfully',
            'new_status_display': complaint.get_status_display() 
        })

    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)