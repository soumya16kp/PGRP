from django.db import models
from django.contrib.auth.models import User
from account.models import Municipality 

class Complaint(models.Model):

    DEPARTMENTS = [
        ("Water", "Water Department"),
        ("Electricity", "Electricity Department"),
        ("Sanitation", "Sanitation Department"),
        ("Roads", "Roads and Transport"),
        ("Illegal Drainage", "Illegal Drainage"),
        ("Dumping", "Illegal Dumping"),
        ("Illegal Construction", "Illegal Construction"),
        ("Public Toilets", "Public Toilets"),
        ("Garbage Collection", "Garbage Collection"),
        ("Others", "Others")
    ]

    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('In Progress', 'In Progress'),
        ('Resolved', 'Resolved'),
        ('Rejected', 'Rejected'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='complaints')
    municipality = models.ForeignKey( 
        Municipality,
        on_delete=models.CASCADE,
        related_name='complaints',
        null=True,
        blank=True
    )
    department = models.CharField(max_length=100, choices=DEPARTMENTS)
    topic = models.CharField(max_length=200)
    description = models.TextField()
    location = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=20, decimal_places=15, )
    longitude = models.DecimalField(max_digits=20, decimal_places=15 )
    media = models.FileField(upload_to='complaint_media/', null=True, blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    upvotes = models.ManyToManyField(User, related_name='upvoted_complaints', blank=True)
    priority = models.DecimalField(max_digits=3, decimal_places=2, default=0.5)


    def total_upvotes(self):
        return self.upvotes.count()

    def __str__(self):
        return f"{self.topic} ({self.department}) - {self.status}"


class Comment(models.Model):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user.username} on {self.complaint.topic}"
