from rest_framework import serializers
from .models import Complaint, Comment
from django.contrib.auth.models import User
from account.serializers import MunicipalitySerializer

class CommentSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'user', 'content', 'created_at']

class ComplaintSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    total_upvotes = serializers.IntegerField(read_only=True)

    is_upvoted = serializers.SerializerMethodField()

    class Meta:
        model = Complaint
        fields = [
            'id', 'user', 'municipality',  
            'department', 'topic', 'description',
            'location', 'latitude', 'longitude', 'media',
            'status', 'created_at', 'updated_at', 'total_upvotes', 'comments', 'priority', 'is_upvoted'
        ]
        # Note: 'status' removed from read_only to allow admin updates via PATCH
        read_only_fields = ['user', 'created_at', 'updated_at', 'total_upvotes', 'comments', 'is_upvoted']

    def get_is_upvoted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.upvotes.filter(id=request.user.id).exists()
        return False
        
class RankedComplaintSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    municipality = MunicipalitySerializer(read_only=True)

    total_upvotes = serializers.SerializerMethodField()
    score = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Complaint
        fields = [
            'id', 'user', 'municipality',
            'department', 'topic', 'description',
            'location', 'latitude', 'longitude',
            'media', 'status',
            'created_at', 'updated_at',
            'priority', 'total_upvotes',
            'score', 'comments'
        ]

    def get_total_upvotes(self, obj):
        return obj.total_upvotes()

    def get_score(self, obj):
        return round(obj.score, 3)
