from django.contrib import admin
from django import forms
from django.contrib.auth.models import User
from .models import MunicipalityOfficial, MunicipalityOTP

# 1. Create a Custom Form for the Admin Panel
class MunicipalityOfficialAdminForm(forms.ModelForm):
    # Add fields that are actually in the User model, not the Official model
    first_name = forms.CharField(label="First Name", max_length=100)
    last_name = forms.CharField(label="Last Name", max_length=100)
    email = forms.EmailField(label="Email (Login Username)", required=True)
    password = forms.CharField(widget=forms.PasswordInput, required=False, help_text="Leave empty to keep existing password if editing.")

    class Meta:
        model = MunicipalityOfficial
        # Exclude the 'user' dropdown so you don't have to pick one manually
        exclude = ['user']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # If we are editing an existing official, populate the User fields
        if self.instance and self.instance.pk and self.instance.user:
            self.fields['first_name'].initial = self.instance.user.first_name
            self.fields['last_name'].initial = self.instance.user.last_name
            self.fields['email'].initial = self.instance.user.email

# 2. Update the Admin Class
@admin.register(MunicipalityOfficial)
class MunicipalityOfficialAdmin(admin.ModelAdmin):
    form = MunicipalityOfficialAdminForm
    
    list_display = ("get_name", "get_email", "phone", "designation", "municipality", "created_at")
    search_fields = ("user__first_name", "user__email", "phone")

    # This function runs when you click "SAVE"
    def save_model(self, request, obj, form, change):
        email = form.cleaned_data.get('email')
        password = form.cleaned_data.get('password')
        first_name = form.cleaned_data.get('first_name')
        last_name = form.cleaned_data.get('last_name')

        if not change:
            if User.objects.filter(username=email).exists():
                pass 
                
            user = User.objects.create_user(
                username=email, 
                email=email, 
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            obj.user = user
        else:
            user = obj.user
            user.email = email
            user.username = email
            user.first_name = first_name
            user.last_name = last_name
            if password:
                user.set_password(password)
            user.save()

        # 3. Save the Official model
        super().save_model(request, obj, form, change)

    @admin.display(description='Name')
    def get_name(self, obj):
        return obj.user.get_full_name() if obj.user else "No User"

    @admin.display(description='Email')
    def get_email(self, obj):
        return obj.user.email if obj.user else "No Email"

# Register OTP model normally
@admin.register(MunicipalityOTP)
class MunicipalityOTPAdmin(admin.ModelAdmin):
    list_display = ("phone", "otp", "created_at")