<?php

namespace App\Http\Controllers\Api;
 
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
 
class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::with('role', 'branch')
            ->when($request->role, fn($q) => $q->whereHas('role', fn($r) => $r->where('name', $request->role)))
            ->when($request->branch_id, fn($q) => $q->where('branch_id', $request->branch_id))
            ->orderBy('name')
            ->paginate(20);
 
        return response()->json($users);
    }
 
    public function store(Request $request)
    {
        $data = $request->validate([
            'role_id' => 'required|exists:roles,id',
            'branch_id' => 'nullable|exists:branches,id',
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string',
        ]);
 
        $data['password'] = Hash::make($data['password']);
        $user = User::create($data);
 
        return response()->json([
            'data' => $user->load('role', 'branch'),
            'message' => 'User created'
        ], 201);
    }
 
    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'role_id' => 'sometimes|exists:roles,id',
            'branch_id' => 'nullable|exists:branches,id',
            'name' => 'sometimes|string',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8',
            'phone' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);
 
        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }
 
        $user->update($data);
        return response()->json(['data' => $user->load('role', 'branch'), 'message' => 'User updated']);
    }
 
    public function destroy(User $user)
    {
        $user->update(['is_active' => false]);
        return response()->json(['message' => 'User deactivated']);
    }
}