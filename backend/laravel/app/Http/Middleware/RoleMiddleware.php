<?php

namespace App\Http\Middleware;
 
use Closure;
use Illuminate\Http\Request;
 
class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): mixed
    {
        $user = $request->user();
 
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
 
        if (!$user->hasAnyRole($roles)) {
            return response()->json([
                'message' => 'Access denied. Required role: ' . implode(' or ', $roles)
            ], 403);
        }
 
        return $next($request);
    }
}