<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_with_organization(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Jane Founder',
            'email' => 'jane@business.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'organization_name' => 'Acme Inc',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'user' => ['id', 'name', 'email', 'organization_name'],
                'token',
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'jane@business.com',
            'organization_name' => 'Acme Inc',
        ]);
    }

    public function test_user_cannot_register_with_duplicate_email(): void
    {
        User::factory()->create([
            'email' => 'existing@business.com',
        ]);

        $response = $this->postJson('/api/register', [
            'name' => 'Duplicate User',
            'email' => 'existing@business.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'organization_name' => 'Acme Inc',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'login@business.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'login@business.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'user',
                'token',
            ]);
    }

    public function test_user_cannot_login_with_invalid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'login@business.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'login@business.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Invalid email or password.',
            ]);
    }

    public function test_authenticated_user_can_get_profile_and_logout(): void
    {
        $user = User::factory()->create([
            'organization_name' => 'Feedback Team',
        ]);

        $token = $user->createToken('test_token')->plainTextToken;

        // Test GET /api/user
        $profileResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/user');

        $profileResponse->assertStatus(200)
            ->assertJsonPath('email', $user->email);

        // Test POST /api/logout
        $logoutResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/logout');

        $logoutResponse->assertStatus(200)
            ->assertJson(['message' => 'Logged out successfully.']);
    }
}
