"""
URL routes for accounts app.
"""
from django.urls import path
from .views import (
    LoginView,
    LogoutView,
    ActivateAccountView,
    ForgotPasswordView,
    ResetPasswordView,
    MeView,
    ChangePasswordView,
    UploadAvatarView,
    RefreshTokenView,
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('activate/', ActivateAccountView.as_view(), name='activate'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('me/', MeView.as_view(), name='me'),
    path('me/avatar/', UploadAvatarView.as_view(), name='upload-avatar'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('refresh/', RefreshTokenView.as_view(), name='token-refresh'),
]
