<?php

namespace Tests\Feature;

use App\Models\FeedbackForm;
use App\Models\FeedbackSubmission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_dashboard_stats(): void
    {
        $response = $this->getJson('/api/dashboard/stats');
        $response->assertStatus(401);
    }

    public function test_new_user_gets_empty_dashboard_stats(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/dashboard/stats?days=30');

        $response->assertStatus(200)
            ->assertJsonPath('metrics.total_forms', 0)
            ->assertJsonPath('metrics.total_responses', 0)
            ->assertJsonPath('metrics.average_rating', null)
            ->assertJsonPath('recent_forms', [])
            ->assertJsonPath('recent_responses', []);
    }

    public function test_dashboard_stats_reflects_actual_database_records(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $form = FeedbackForm::create([
            'user_id' => $user->id,
            'title' => 'Customer CSAT Survey',
            'slug' => 'customer-csat-survey',
            'status' => 'published',
        ]);

        FeedbackSubmission::create([
            'feedback_form_id' => $form->id,
            'customer_name' => 'Alice Client',
            'rating' => 5,
            'summary_preview' => 'Outstanding support!',
            'review_status' => 'new',
        ]);

        FeedbackSubmission::create([
            'feedback_form_id' => $form->id,
            'customer_name' => 'Bob Buyer',
            'rating' => 4,
            'summary_preview' => 'Good product quality.',
            'review_status' => 'reviewed',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/dashboard/stats?days=30');

        $response->assertStatus(200)
            ->assertJsonPath('metrics.total_forms', 1)
            ->assertJsonPath('metrics.published_forms', 1)
            ->assertJsonPath('metrics.total_responses', 2)
            ->assertJsonPath('metrics.average_rating', 4.5)
            ->assertJsonPath('recent_forms.0.title', 'Customer CSAT Survey')
            ->assertJsonCount(2, 'recent_responses');
    }

    public function test_user_cannot_delete_another_users_form(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();

        $form = FeedbackForm::create([
            'user_id' => $owner->id,
            'title' => 'Private Form',
            'slug' => 'private-form',
            'status' => 'published',
        ]);

        $token = $otherUser->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->deleteJson('/api/forms/' . $form->id);

        $response->assertStatus(404);
        $this->assertDatabaseHas('feedback_forms', ['id' => $form->id]);
    }
}
