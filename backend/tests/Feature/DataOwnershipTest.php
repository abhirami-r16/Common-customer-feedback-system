<?php

namespace Tests\Feature;

use App\Models\FeedbackForm;
use App\Models\FeedbackSubmission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DataOwnershipTest extends TestCase
{
    use RefreshDatabase;

    public function test_business_user_cannot_view_another_business_users_form(): void
    {
        $owner = User::factory()->create(['role' => 'business']);
        $attacker = User::factory()->create(['role' => 'business']);

        $form = FeedbackForm::create([
            'user_id' => $owner->id,
            'title' => 'Owner Secret Survey',
            'slug' => 'owner-secret-survey',
            'status' => 'draft',
        ]);

        $attackerToken = $attacker->createToken('attacker')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $attackerToken)
            ->getJson('/api/forms/' . $form->id);

        $response->assertStatus(403);
    }

    public function test_business_user_cannot_update_status_of_another_users_form(): void
    {
        $owner = User::factory()->create(['role' => 'business']);
        $attacker = User::factory()->create(['role' => 'business']);

        $form = FeedbackForm::create([
            'user_id' => $owner->id,
            'title' => 'Owner Survey',
            'slug' => 'owner-survey',
            'status' => 'draft',
        ]);

        $attackerToken = $attacker->createToken('attacker')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $attackerToken)
            ->patchJson('/api/forms/' . $form->id . '/status', [
                'status' => 'published',
            ]);

        $response->assertStatus(403);
        $this->assertEquals('draft', $form->fresh()->status);
    }

    public function test_business_user_cannot_view_or_delete_another_users_responses(): void
    {
        $owner = User::factory()->create(['role' => 'business']);
        $attacker = User::factory()->create(['role' => 'business']);

        $form = FeedbackForm::create([
            'user_id' => $owner->id,
            'title' => 'Owner Form',
            'slug' => 'owner-form',
            'status' => 'published',
        ]);

        $submission = $form->submissions()->create([
            'customer_name' => 'Alice Customer',
            'customer_email' => 'alice@client.com',
            'rating' => 5,
            'summary_preview' => 'Outstanding support experience.',
        ]);

        $attackerToken = $attacker->createToken('attacker')->plainTextToken;

        // Attacker attempts to filter by owner's form_id
        $filterResponse = $this->withHeader('Authorization', 'Bearer ' . $attackerToken)
            ->getJson('/api/responses?form_id=' . $form->id);
        $filterResponse->assertStatus(403);

        // Attacker attempts to fetch single response
        $singleResponse = $this->withHeader('Authorization', 'Bearer ' . $attackerToken)
            ->getJson('/api/responses/' . $submission->id);
        $singleResponse->assertStatus(403);

        // Attacker attempts to fetch form-specific responses
        $formResp = $this->withHeader('Authorization', 'Bearer ' . $attackerToken)
            ->getJson('/api/forms/' . $form->id . '/responses');
        $formResp->assertStatus(403);

        // Attacker attempts to delete owner's submission
        $deleteResponse = $this->withHeader('Authorization', 'Bearer ' . $attackerToken)
            ->deleteJson('/api/responses/' . $submission->id);
        $deleteResponse->assertStatus(403);

        $this->assertDatabaseHas('feedback_submissions', ['id' => $submission->id]);
    }

    public function test_business_owner_can_view_and_manage_own_forms_and_responses(): void
    {
        $owner = User::factory()->create(['role' => 'business']);
        $ownerToken = $owner->createToken('owner')->plainTextToken;

        $form = FeedbackForm::create([
            'user_id' => $owner->id,
            'title' => 'Product Feedback Q4',
            'slug' => 'product-feedback-q4',
            'status' => 'published',
        ]);

        $submission = $form->submissions()->create([
            'customer_name' => 'Bob Customer',
            'customer_email' => 'bob@client.com',
            'rating' => 4,
            'summary_preview' => 'Very good workflow.',
        ]);

        // Form responses endpoint
        $res = $this->withHeader('Authorization', 'Bearer ' . $ownerToken)
            ->getJson('/api/forms/' . $form->id . '/responses');
        $res->assertStatus(200);

        // Single response endpoint
        $single = $this->withHeader('Authorization', 'Bearer ' . $ownerToken)
            ->getJson('/api/responses/' . $submission->id);
        $single->assertStatus(200)
            ->assertJsonPath('customer_name', 'Bob Customer');

        // Delete own response
        $del = $this->withHeader('Authorization', 'Bearer ' . $ownerToken)
            ->deleteJson('/api/responses/' . $submission->id);
        $del->assertStatus(200);
        $this->assertDatabaseMissing('feedback_submissions', ['id' => $submission->id]);
    }

    public function test_admin_can_view_all_business_forms_and_responses(): void
    {
        $businessUser = User::factory()->create(['role' => 'business']);
        $adminUser = User::factory()->create(['role' => 'admin']);

        $form = FeedbackForm::create([
            'user_id' => $businessUser->id,
            'title' => 'Tenant Survey',
            'slug' => 'tenant-survey',
            'status' => 'published',
        ]);

        $submission = $form->submissions()->create([
            'customer_name' => 'Global Customer',
            'customer_email' => 'global@example.com',
            'rating' => 5,
        ]);

        $adminToken = $adminUser->createToken('admin')->plainTextToken;

        $adminForms = $this->withHeader('Authorization', 'Bearer ' . $adminToken)
            ->getJson('/api/admin/forms');
        $adminForms->assertStatus(200);

        $adminResponses = $this->withHeader('Authorization', 'Bearer ' . $adminToken)
            ->getJson('/api/admin/responses');
        $adminResponses->assertStatus(200);

        // Admin can delete any response
        $adminDel = $this->withHeader('Authorization', 'Bearer ' . $adminToken)
            ->deleteJson('/api/admin/responses/' . $submission->id);
        $adminDel->assertStatus(200);
        $this->assertDatabaseMissing('feedback_submissions', ['id' => $submission->id]);
    }

    public function test_public_submissions_only_accepted_for_published_forms(): void
    {
        $businessUser = User::factory()->create(['role' => 'business']);

        $draftForm = FeedbackForm::create([
            'user_id' => $businessUser->id,
            'title' => 'Draft Form',
            'slug' => 'draft-form-slug',
            'status' => 'draft',
        ]);

        // Public view of draft form should 404
        $this->getJson('/api/public/forms/draft-form-slug')->assertStatus(404);

        // Public submission on draft form should 404
        $this->postJson('/api/public/forms/draft-form-slug/submit', [
            'answers' => [],
        ])->assertStatus(404);

        // Published form
        $publishedForm = FeedbackForm::create([
            'user_id' => $businessUser->id,
            'title' => 'Published Form',
            'slug' => 'published-form-slug',
            'status' => 'published',
        ]);

        $this->getJson('/api/public/forms/published-form-slug')->assertStatus(200);

        $submitRes = $this->postJson('/api/public/forms/published-form-slug/submit', [
            'customer_name' => 'Charlie Buyer',
            'customer_email' => 'charlie@gmail.com',
            'answers' => [],
        ]);

        $submitRes->assertStatus(200)
            ->assertJsonStructure(['message', 'submission_id']);

        $this->assertDatabaseHas('feedback_submissions', [
            'feedback_form_id' => $publishedForm->id,
            'customer_name' => 'Charlie Buyer',
        ]);
    }
}
