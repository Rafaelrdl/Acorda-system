"""
Admin configuration for accounts app.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, ActivationToken, PasswordResetToken


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'name', 'status', 'created_at', 'last_login']
    list_filter = ['status', 'is_staff', 'created_at']
    search_fields = ['email', 'name']
    ordering = ['-created_at']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informações pessoais', {'fields': ('name', 'timezone')}),
        ('Status', {'fields': ('status', 'is_active', 'is_staff', 'is_superuser')}),
        ('Datas', {'fields': ('created_at', 'updated_at', 'last_login', 'activated_at')}),
        ('Permissões', {'fields': ('groups', 'user_permissions')}),
    )
    
    readonly_fields = ['created_at', 'updated_at', 'last_login', 'activated_at']
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'name', 'status'),
        }),
    )


@admin.register(ActivationToken)
class ActivationTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'created_at', 'expires_at', 'used_at', 'is_valid_display']
    list_filter = ['created_at', 'used_at']
    search_fields = ['user__email']
    readonly_fields = ['token', 'created_at']
    
    def is_valid_display(self, obj):
        return obj.is_valid
    is_valid_display.boolean = True
    is_valid_display.short_description = 'Válido'


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'created_at', 'expires_at', 'used_at', 'is_valid_display']
    list_filter = ['created_at', 'used_at']
    search_fields = ['user__email']
    readonly_fields = ['token', 'created_at']
    
    def is_valid_display(self, obj):
        return obj.is_valid
    is_valid_display.boolean = True
    is_valid_display.short_description = 'Válido'
