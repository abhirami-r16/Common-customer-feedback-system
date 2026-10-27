<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleBasedAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_registration_always_creates_business_account_and_ignores_supplied_admin_role(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Attempted Hacker',
            'email' => 'hacker@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'organization_name' => 'Security Corp',
            'role' => 'admin', // Malicious attempt to register as admin
        ]);

        $response->assertStatus(201);
        $this->assertEquals('business', $response->json('user.role'));

        $user = User::where('email', 'hacker@example.com')->first();
        $this->assertNotNull($user);
        $this->assertEquals('business', $user->role);
        $this->assertFalse($user->isAdmin());
        $this->assertTrue($user->isBusiness());
    }

    public function test_admin_email_configured_user_is_promoted_on_login(): void
    {
        config(['app.admin_email' => 'admin@gmail.com']);

        $adminUser = User::factory()->create([
            'email' => 'admin@gmail.com',
            'password' => bcrypt('adminsecret'),
            'role' => 'business', // Initially unpromoted in DB
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'admin@gmail.com',
            'password' => 'adminsecret',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('admin', $response->json('user.role'));

        $adminUser->refresh();
        $this->assertEquals('admin', $adminUser->role);
        $this->assertTrue($adminUser->isAdmin());
    }

    public function test_business_user_cannot_access_admin_api_endpoints(): void
    {
        $businessUser = User::factory()->create([
            'role' => 'business',
        ]);

        $token = $businessUser->createToken('test')->plainTextToken;

        // Admin stats
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/admin/stats');
        $response->assertStatus(403);

        // Admin users list
        $responseUsers = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/admin/users');
        $responseUsers->assertStatus(403);

        // Admin forms list
        $responseForms = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/admin/forms');
        $responseForms->assertStatus(403);

        // Admin responses list
        $responseSubmissions = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/admin/responses');
        $responseSubmissions->assertStatus(403);
    }

    public function test_admin_user_cannot_access_business_endpoints_as_business_customer(): void
    {
        $adminUser = User::factory()->create([
            'role' => 'admin',
        ]);

        $token = $adminUser->createToken('test')->plainTextToken;

        // Business dashboard stats
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/dashboard/stats');
        $response->assertStatus(403);

        // Business forms endpoint
        $responseForms = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/forms');
        $responseForms->assertStatus(403);
    }

    public function test_admin_can_access_all_admin_endpoints(): void
    {
        $adminUser = User::factory()->create([
            'role' => 'admin',
        ]);

        $token = $adminUser->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/admin/stats');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'metrics' => [
                    'total_business_users',
                    'total_users',
                    'total_forms',
                    'total_responses',
                ],
            ]);

        $responseUsers = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/admin/users');
        $responseUsers->assertStatus(200);

        $responseForms = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/admin/forms');
        $responseForms->assertStatus(200);

        $responseSubmissions = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/admin/responses');
        $responseSubmissions->assertStatus(200);
    }

    public function test_admin_can_delete_any_feedback_form(): void
    {
        $adminUser = User::factory()->create(['role' => 'admin']);
        $businessUser = User::factory()->create(['role' => 'business']);

        $form = \App\Models\FeedbackForm::create([
            'user_id' => $businessUser->id,
            'title' => 'Form to be deleted',
            'slug' => 'form-to-delete-' . uniqid(),
            'status' => 'published',
        ]);

        $token = $adminUser->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->deleteJson("/api/admin/forms/{$form->id}");

        $response->assertStatus(200)
            ->assertJsonFragment(['message' => 'Feedback form and all associated responses deleted successfully.']);

        $this->assertDatabaseMissing('feedback_forms', ['id' => $form->id]);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/dashboard/stats')->assertStatus(401);
        $this->getJson('/api/admin/stats')->assertStatus(401);
        $this->getJson('/api/forms')->assertStatus(401);
        $this->getJson('/api/responses')->assertStatus(401);
    }
}

