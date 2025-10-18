from rest_framework import serializers
from .models import Complaint, Comment
from django.contrib.auth.models import User


class CommentSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'user', 'content', 'created_at']

class ComplaintSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    total_upvotes = serializers.IntegerField(read_only=True)

    class Meta:
        model = Complaint
        fields = [
            'id', 'user', 'municipality',  
            'department', 'topic', 'description',
            'location', 'latitude', 'longitude', 'media',
            'status', 'created_at', 'updated_at', 'total_upvotes', 'comments','priority'
        ]
        read_only_fields = ['user', 'status', 'created_at', 'updated_at', 'total_upvotes', 'comments']
