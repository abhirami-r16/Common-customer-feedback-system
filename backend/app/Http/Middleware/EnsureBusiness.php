<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureBusiness
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (!$user->isBusiness()) {
            return response()->json([
                'message' => 'Unauthorized: Business customer account required. Administrator accounts must use the Admin Portal.',
            ], 403);
        }

        return $next($request);
    }
}
