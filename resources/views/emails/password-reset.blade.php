@component('mail::message')
# Password Reset Request

Hello {{ $userName }},

We received a request to reset your password for the IAA Inventory Management System.

Use the button below to create a new secure password.

@component('mail::button', ['url' => $resetUrl])
Reset Password
@endcomponent

If you did not request this password reset, you can ignore this email.

This link is intended for a secure password update and should be used on the system portal.

Thanks,<br>
{{ $appName }}
@endcomponent
