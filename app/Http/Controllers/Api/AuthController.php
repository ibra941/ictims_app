<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string',
            'password' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('username', $request->username)
            ->orWhere('email', $request->username)
            ->with('role')
            ->first();

        if (!$user) {
            return response()->json([
                'message' => 'User not found.',
                'errors' => ['username' => ['User not found.']]
            ], 404);
        }

        // Support the schema used by this project: either password or password_hash.
        $storedPassword = $user->password_hash ?? $user->password ?? null;
        if (!$storedPassword || !Hash::check($request->password, $storedPassword)) {
            return response()->json([
                'message' => 'The provided credentials are incorrect.',
                'errors' => ['username' => ['The provided credentials are incorrect.']]
            ], 422);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'Your account is deactivated. Please contact administrator.'
            ], 403);
        }

        $user->last_login = now();
        $user->ip_address = $request->ip();
        $user->save();

        // Create token
        $token = $user->createToken('auth_token')->plainTextToken;

        $firstName = $user->first_name ?? null;
        $lastName = $user->last_name ?? null;
        $fullName = trim(($firstName ?: '') . ' ' . ($lastName ?: '')) ?: $user->username;

        return response()->json([
            'message' => 'Login successful',
            'user' => [
                'user_id' => $user->user_id,
                'username' => $user->username,
                'email' => $user->email,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'full_name' => $fullName,
                'role' => $user->role ? $user->role->name : null
            ],
            'access_token' => $token,
            'token_type' => 'Bearer'
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('role');
        
        return response()->json([
            'user' => $user,
            'role' => $user->role ? $user->role->name : null,
        ]);
    }
}
