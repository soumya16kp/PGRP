from django.contrib import admin
from .models import Profile,Municipality

class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'designation', 'phone', 'email_display')
    search_fields = ('user__username', 'user__email', 'designation', 'phone')

    def email_display(self, obj):
        return obj.user.email
    email_display.short_description = 'Email'

admin.site.register(Profile, ProfileAdmin)

class MunicipalityAdmin(admin.ModelAdmin):
    list_display = ('name', 'district', 'state', 'latitude', 'longitude')
    search_fields = ('name', 'district', 'state')

admin.site.register(Municipality, MunicipalityAdmin)