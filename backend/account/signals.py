from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Profile

@receiver(post_save, sender=User)
def create_or_update_profile(sender, instance, created, **kwargs):
    if created:
        
        Profile.objects.create(user=instance)
    else:
        instance.profile.save()


@receiver(post_save, sender=Profile)
def assign_municipality_on_save(sender, instance, created, **kwargs):
    if instance.latitude and instance.longitude:
        instance.assign_nearest_municipality()