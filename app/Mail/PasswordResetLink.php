<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PasswordResetLink extends Mailable
{
    use Queueable, SerializesModels;

    public string $userName;
    public string $email;
    public string $token;

    public function __construct(string $userName, string $email, string $token)
    {
        $this->userName = $userName;
        $this->email = $email;
        $this->token = $token;
    }

    public function build()
    {
        $resetUrl = rtrim(config('app.url', 'http://127.0.0.1:8003'), '/') . '/reset-password?email=' . urlencode($this->email) . '&token=' . urlencode($this->token);

        return $this->subject('IAA Inventory Management System - Password Reset')
            ->markdown('emails.password-reset')
            ->with([
                'userName' => $this->userName,
                'resetUrl' => $resetUrl,
                'appName' => config('app.name', 'ICTIMS'),
            ]);
    }
}
