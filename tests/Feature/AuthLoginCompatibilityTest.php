<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthLoginCompatibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_accepts_standard_password_column(): void
    {
        User::create([
            'username' => 'compat-admin',
            'email' => 'compat-admin@iaa.ac.tz',
            'password' => Hash::make('Password123!'),
            'role_id' => 1,
            'is_active' => true,
        ]);

        $response = $this->postJson('/login', [
            'username' => 'compat-admin',
            'password' => 'Password123!',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.user.username', 'compat-admin');
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.user.name', 'compat-admin');
    }
}
