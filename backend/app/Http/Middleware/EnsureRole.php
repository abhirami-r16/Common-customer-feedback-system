<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $role
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ($role === 'admin' && !$user->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized: Platform Administrator privileges required.',
            ], 403);
        }

        if ($role === 'business' && !$user->isBusiness()) {
            return response()->json([
                'message' => 'Unauthorized: Business customer account required. Administrator accounts must use the Admin Portal.',
            ], 403);
        }

        return $next($request);
    }
}
