<?php

namespace App\Http\Controllers;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new user and organization.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'organization_name' => ['required', 'string', 'max:255'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'organization_name' => $validated['organization_name'],
            'role' => User::ROLE_BUSINESS,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful.',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    /**
     * Authenticate user credentials and return an API token.
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (!Auth::attempt($credentials)) {
            return response()->json([
                'message' => 'Invalid email or password.',
            ], 401);
        }

        /** @var User $user */
        $user = Auth::user();

        // Securely synchronize backend admin role if email matches ADMIN_EMAIL
        $adminEmail = config('app.admin_email', env('ADMIN_EMAIL'));
        if ($adminEmail && strcasecmp($user->email, $adminEmail) === 0 && $user->role !== User::ROLE_ADMIN) {
            $user->role = User::ROLE_ADMIN;
            $user->save();
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * Log out the authenticated user by revoking the current access token.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * Get the authenticated user profile.
     */
    public function user(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }

    /**
     * Send password reset token/link.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user) {
            return response()->json([
                'message' => 'We could not find an account with that email address.',
                'errors' => [
                    'email' => ['No registered account matches this email address.']
                ]
            ], 422);
        }

        // Generate a cryptographically secure reset token
        $token = Str::random(64);

        // Store or update the token in password_reset_tokens table
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'token' => $token,
                'created_at' => now(),
            ]
        );

        $frontendBase = env('FRONTEND_URL', 'http://localhost:5173');
        $resetUrl = rtrim($frontendBase, '/') . "/reset-password?token={$token}&email=" . urlencode($user->email);

        // Attempt sending email if mailer is configured, safely handled if offline
        try {
            Mail::raw("Hello {$user->name},\n\nYou requested a password reset for your FeedbackHub account.\nClick the link below to set a new password:\n\n{$resetUrl}\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nFeedbackHub Team", function ($message) use ($user) {
                $message->to($user->email)
                    ->subject('Reset Your FeedbackHub Password');
            });
        } catch (\Throwable $e) {
            Log::warning('Failed sending password reset email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Password reset instructions have been generated.',
            'email' => $user->email,
            'token' => $token,
            'reset_url' => $resetUrl,
        ]);
    }

    /**
     * Reset the user password with email, new password, and confirm password.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'token' => ['nullable', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user) {
            return response()->json([
                'message' => 'We could not find an account with that email address.',
                'errors' => [
                    'email' => ['No registered account matches this email address.']
                ]
            ], 422);
        }

        // If a token was provided, validate token if present
        if (!empty($validated['token'])) {
            $record = DB::table('password_reset_tokens')
                ->where('email', $validated['email'])
                ->first();

            if ($record && !hash_equals($record->token, $validated['token'])) {
                return response()->json([
                    'message' => 'The password reset token is invalid or has already been used.',
                    'errors' => [
                        'token' => ['Invalid or expired reset token.']
                    ]
                ], 422);
            }
        }

        // Update user password
        $user->password = Hash::make($validated['password']);
        $user->save();

        // Clean up any reset tokens for this email
        DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();

        return response()->json([
            'message' => 'Password has been changed successfully. You can now sign in with your new password.',
        ]);
    }
}
