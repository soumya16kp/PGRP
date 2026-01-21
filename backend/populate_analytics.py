
import os
import django
import random
from datetime import datetime, timedelta
from django.utils import timezone

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from account.models import Municipality, Profile
from complaints.models import Complaint, ComplaintActivity
from review.models import Review

def populate():
    print("🚀 Starting Data Population...")

    # 1. Get Municipality ID 2 (Bhubaneswar)
    try:
        muni = Municipality.objects.get(id=2)
        print(f"Using Municipality: {muni.name} (ID: {muni.id})")
    except Municipality.DoesNotExist:
        print("Municipality ID 2 not found! Creating fallback.")
        muni = Municipality.objects.create(name="Bhubaneswar Municipality", district="Khurda", state="Odisha")

    # 2. Get or Create Dummy Users
    users = []
    for i in range(5):
        username = f"citizen_{i}"
        user, _ = User.objects.get_or_create(username=username)
        # Ensure profile exists
        Profile.objects.get_or_create(user=user, defaults={'municipality': muni})
        users.append(user)
    
    # 3. Create Complaints over the last 6 months
    departments = ["Water", "Electricity", "Roads", "Sanitation", "Garbage Collection"]
    
    end_date = timezone.now()
    records_created = 0

    for i in range(50): # Create 50 complaints
        # Random date in last 180 days
        days_ago = random.randint(0, 180)
        created_at = end_date - timedelta(days=days_ago)
        
        dept = random.choice(departments)
        status_choice = random.choices(
            ['Resolved', 'Pending', 'In Progress', 'Rejected'], 
            weights=[40, 30, 20, 10], 
            k=1
        )[0]
        
        user = random.choice(users)
        
        complaint = Complaint.objects.create(
            user=user,
            municipality=muni,
            department=dept,
            topic=f"{dept} Issue at Sector {random.randint(1, 20)}",
            description="Detailed description of the issue faced by the citizen.",
            location=f"Sector {random.randint(1, 20)}",
            latitude=12.97 + random.uniform(-0.01, 0.01),
            longitude=77.59 + random.uniform(-0.01, 0.01),
            status=status_choice,
            priority=random.uniform(0.1, 0.9)
        )
        
        # Force update created_at (auto_now_add makes it read-only on creation)
        Complaint.objects.filter(id=complaint.id).update(created_at=created_at)

        if status_choice == 'Resolved':
            updated_at = created_at + timedelta(days=random.randint(1, 5))
            Complaint.objects.filter(id=complaint.id).update(updated_at=updated_at)
            
            # 4. Add Reviews for Resolved Complaints
            if random.random() < 0.8:
                rating = random.choices([1, 2, 3, 4, 5], weights=[5, 10, 20, 30, 35], k=1)[0]
                Review.objects.create(
                    complaint=complaint,
                    user=user.profile,
                    rating=rating,
                    feedback="Service was " + ("good" if rating > 3 else "bad")
                )

        records_created += 1

    print(f"✅ Successfully created {records_created} complaints with historical data.")

if __name__ == "__main__":
    populate()
