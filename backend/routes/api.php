<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FormBuilderController;
use Illuminate\Support\Facades\Route;

// Public Authentication & Public Form Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::get('/public/forms/{slug}', [FormBuilderController::class, 'publicView']);
Route::post('/public/forms/{slug}/submit', [FormBuilderController::class, 'submitFeedback']);

// Protected Routes (Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Business Customer Endpoints (Protected by role:business)
    Route::middleware('role:business')->group(function () {
        // Dashboard Metrics & Charts
        Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

        // Forms Management
        Route::get('/forms', [DashboardController::class, 'forms']);
        Route::post('/forms', [DashboardController::class, 'storeForm']);
        Route::get('/forms/{id}', [FormBuilderController::class, 'show']);
        Route::delete('/forms/{id}', [DashboardController::class, 'destroyForm']);
        Route::get('/forms/{id}/responses', [DashboardController::class, 'formResponses']);

        // Form Builder Endpoints
        Route::post('/forms/builder', [FormBuilderController::class, 'save']);
        Route::patch('/forms/{id}/status', [FormBuilderController::class, 'updateStatus']);

        // Responses Management
        Route::get('/responses', [DashboardController::class, 'responses']);
        Route::get('/responses/{id}', [DashboardController::class, 'showResponse']);
        Route::delete('/responses/{id}', [DashboardController::class, 'destroyResponse']);
    });

    // Super Admin Platform Management Endpoints (Protected by role:admin)
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/stats', [AdminController::class, 'stats']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::get('/featured-users', [AdminController::class, 'featuredUsers']);
        Route::get('/users/{id}', [AdminController::class, 'showUser']);
        Route::patch('/users/{id}/role', [AdminController::class, 'updateUserRole']);
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
        Route::get('/forms', [AdminController::class, 'forms']);
        Route::delete('/forms/{id}', [AdminController::class, 'destroyForm']);
        Route::get('/responses', [AdminController::class, 'responses']);
        Route::delete('/responses/{id}', [AdminController::class, 'destroyResponse']);
    });
});
