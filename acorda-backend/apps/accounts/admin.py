"""
Admin configuration for accounts app.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.utils import timezone
from .models import User, ActivationToken, PasswordResetToken


class ActivationTokenInline(admin.TabularInline):
    model = ActivationToken
    extra = 0
    readonly_fields = ['token', 'created_at', 'expires_at', 'used_at', 'is_valid_display']
    fields = ['token', 'created_at', 'expires_at', 'used_at', 'is_valid_display']
    can_delete = False
    max_num = 0  # Don't allow adding via inline

    def is_valid_display(self, obj):
        return obj.is_valid
    is_valid_display.boolean = True
    is_valid_display.short_description = 'Válido'


class PasswordResetTokenInline(admin.TabularInline):
    model = PasswordResetToken
    extra = 0
    readonly_fields = ['token', 'created_at', 'expires_at', 'used_at', 'is_valid_display']
    fields = ['token', 'created_at', 'expires_at', 'used_at', 'is_valid_display']
    can_delete = False
    max_num = 0

    def is_valid_display(self, obj):
        return obj.is_valid
    is_valid_display.boolean = True
    is_valid_display.short_description = 'Válido'


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = [
        'email', 'name', 'status_badge', 'appearance',
        'is_staff', 'is_superuser', 'created_at', 'last_login',
    ]
    list_filter = ['status', 'is_staff', 'is_superuser', 'is_active', 'appearance', 'created_at']
    search_fields = ['email', 'name']
    ordering = ['-created_at']
    list_per_page = 25
    date_hierarchy = 'created_at'

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informações pessoais', {'fields': ('name', 'avatar_url')}),
        ('Status da conta', {'fields': ('status', 'is_active', 'is_staff', 'is_superuser')}),
        ('Preferências', {
            'fields': ('timezone', 'appearance', 'week_starts_on', 'enabled_modules'),
            'classes': ('collapse',),
        }),
        ('Datas importantes', {
            'fields': ('created_at', 'updated_at', 'last_login', 'activated_at'),
        }),
        ('Permissões', {
            'fields': ('groups', 'user_permissions'),
            'classes': ('collapse',),
        }),
    )

    readonly_fields = ['created_at', 'updated_at', 'last_login', 'activated_at']

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'name', 'status'),
        }),
    )

    inlines = [ActivationTokenInline, PasswordResetTokenInline]

    actions = ['activate_users', 'suspend_users', 'cancel_users']

    @admin.display(description='Status', ordering='status')
    def status_badge(self, obj):
        colors = {
            'pending_activation': '#f0ad4e',
            'active': '#5cb85c',
            'suspended': '#d9534f',
            'cancelled': '#777',
        }
        color = colors.get(obj.status, '#777')
        return format_html(
            '<span style="background:{}; color:#fff; padding:3px 10px; '
            'border-radius:3px; font-size:11px;">{}</span>',
            color, obj.get_status_display(),
        )

    @admin.action(description='Ativar usuários selecionados')
    def activate_users(self, request, queryset):
        updated = 0
        for user in queryset.exclude(status=User.Status.ACTIVE):
            user.activate()
            updated += 1
        self.message_user(request, f'{updated} usuário(s) ativado(s).')

    @admin.action(description='Suspender usuários selecionados')
    def suspend_users(self, request, queryset):
        updated = queryset.exclude(status=User.Status.SUSPENDED).update(
            status=User.Status.SUSPENDED,
        )
        self.message_user(request, f'{updated} usuário(s) suspenso(s).')

    @admin.action(description='Cancelar usuários selecionados')
    def cancel_users(self, request, queryset):
        updated = queryset.exclude(status=User.Status.CANCELLED).update(
            status=User.Status.CANCELLED,
        )
        self.message_user(request, f'{updated} usuário(s) cancelado(s).')


@admin.register(ActivationToken)
class ActivationTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'token_short', 'created_at', 'expires_at', 'used_at', 'is_valid_display']
    list_filter = ['created_at', 'used_at']
    search_fields = ['user__email', 'token']
    readonly_fields = ['token', 'created_at']
    raw_id_fields = ['user']
    list_per_page = 25

    @admin.display(description='Token', ordering='token')
    def token_short(self, obj):
        return f'{obj.token[:12]}...' if obj.token else '-'

    @admin.display(description='Válido', boolean=True)
    def is_valid_display(self, obj):
        return obj.is_valid


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'token_short', 'created_at', 'expires_at', 'used_at', 'is_valid_display']
    list_filter = ['created_at', 'used_at']
    search_fields = ['user__email', 'token']
    readonly_fields = ['token', 'created_at']
    raw_id_fields = ['user']
    list_per_page = 25

    @admin.display(description='Token', ordering='token')
    def token_short(self, obj):
        return f'{obj.token[:12]}...' if obj.token else '-'

    @admin.display(description='Válido', boolean=True)
    def is_valid_display(self, obj):
        return obj.is_valid
