<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class TestLoginController extends Controller
{
    public function test(Request $request)
    {
        $username = $request->input('username', 'admin');
        $password = $request->input('password', 'password');
        
        $user = User::where('username', $username)->first();
        
        if (!$user) {
            return response()->json(['error' => 'User not found', 'users' => User::select('username')->get()]);
        }
        
        $storedPassword = $user->password_hash ?? $user->password ?? null;
        $passwordCheck = $storedPassword ? Hash::check($password, $storedPassword) : false;

        return response()->json([
            'user_found' => true,
            'username' => $user->username,
            'password_check' => $passwordCheck,
            'stored_password_field' => $storedPassword ? 'present' : 'missing',
            'test_password' => $password,
        ]);
    }
}
