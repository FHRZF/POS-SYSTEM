<?php

namespace App\Http\Controllers\Api;
 
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
 
class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);
 
        $user = User::with('role', 'branch')
            ->where('email', $request->email)
            ->first();
 
        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }
 
        if (!$user->is_active) {
            return response()->json([
                'message' => 'Your account has been deactivated.'
            ], 403);
        }
 
        $token = $user->createToken('pos-token')->plainTextToken;
 
        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
                'role' => $user->role,
                'role_display' => $user->role ? $user->role->display_name : null,
                'branch_id' => $user->branch_id,
                'branch' => $user->branch,
            ],
            'token' => $token,
        ]);
    }
 
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }
 
    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user()->load('role', 'branch'),
        ]);
    }
 
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'password' => 'required|string|min:8|confirmed',
        ]);
 
        $user = $request->user();
 
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is wrong'], 422);
        }
 
        $user->update(['password' => Hash::make($request->password)]);
        return response()->json(['message' => 'Password changed successfully']);
    }
}
 