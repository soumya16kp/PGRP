import os
from rest_framework import generics
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Complaint, Comment
from account.models import Municipality
from django.shortcuts import get_object_or_404
from .serializers import ComplaintSerializer, CommentSerializer
from openai import OpenAI


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
                representing the urgency or severity (0 = trivial, 1 = extremely urgent).
                
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

        serializer.save(user=self.request.user, municipality=municipality, priority=priority)

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
