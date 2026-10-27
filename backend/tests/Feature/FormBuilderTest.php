<?php

namespace Tests\Feature;

use App\Models\FeedbackForm;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FormBuilderTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_save_nested_form_structure_with_sections_and_questions(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $payload = [
            'title' => 'Client Experience Survey',
            'description' => 'Help us improve our service',
            'status' => 'draft',
            'sections' => [
                [
                    'title' => 'Service Quality',
                    'description' => 'Questions regarding overall satisfaction',
                    'position' => 0,
                    'questions' => [
                        [
                            'question_text' => 'How would you rate your experience?',
                            'question_type' => 'star_rating',
                            'is_required' => true,
                            'settings' => ['max_rating' => 5],
                            'position' => 0,
                        ],
                        [
                            'question_text' => 'Which department did you contact?',
                            'question_type' => 'multiple_choice',
                            'is_required' => true,
                            'position' => 1,
                            'options' => [
                                ['option_text' => 'Sales', 'position' => 0],
                                ['option_text' => 'Support', 'position' => 1],
                                ['option_text' => 'Billing', 'position' => 2],
                            ],
                        ],
                        [
                            'question_text' => 'Additional suggestions',
                            'question_type' => 'long_text',
                            'is_required' => false,
                            'position' => 2,
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/forms/builder', $payload);

        $response->assertStatus(200)
            ->assertJsonPath('form.title', 'Client Experience Survey')
            ->assertJsonPath('form.status', 'draft')
            ->assertJsonCount(1, 'form.sections')
            ->assertJsonCount(3, 'form.sections.0.questions')
            ->assertJsonCount(3, 'form.sections.0.questions.1.options');

        $this->assertDatabaseHas('feedback_forms', [
            'user_id' => $user->id,
            'title' => 'Client Experience Survey',
        ]);

        $this->assertDatabaseHas('form_sections', [
            'title' => 'Service Quality',
        ]);

        $this->assertDatabaseHas('form_questions', [
            'question_text' => 'How would you rate your experience?',
            'question_type' => 'star_rating',
        ]);

        $this->assertDatabaseHas('question_options', [
            'option_text' => 'Support',
        ]);
    }

    public function test_choice_question_without_options_fails_validation(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $payload = [
            'title' => 'Invalid Form',
            'status' => 'draft',
            'sections' => [
                [
                    'title' => 'Section 1',
                    'position' => 0,
                    'questions' => [
                        [
                            'question_text' => 'Choose one',
                            'question_type' => 'multiple_choice',
                            'is_required' => true,
                            'options' => [], // Empty options
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/forms/builder', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['sections.0.questions.0.options']);
    }

    public function test_form_status_can_be_updated(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $form = FeedbackForm::create([
            'user_id' => $user->id,
            'title' => 'Draft Form',
            'slug' => 'draft-form',
            'status' => 'draft',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson('/api/forms/' . $form->id . '/status', ['status' => 'published']);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'published');

        $this->assertDatabaseHas('feedback_forms', [
            'id' => $form->id,
            'status' => 'published',
        ]);
    }

    public function test_public_form_view_only_allows_published_forms(): void
    {
        $user = User::factory()->create();

        $draftForm = FeedbackForm::create([
            'user_id' => $user->id,
            'title' => 'Secret Draft',
            'slug' => 'secret-draft',
            'status' => 'draft',
        ]);

        $publishedForm = FeedbackForm::create([
            'user_id' => $user->id,
            'title' => 'Live Survey',
            'slug' => 'live-survey',
            'status' => 'published',
        ]);

        // Draft form should 404 on public route
        $this->getJson('/api/public/forms/' . $draftForm->slug)->assertStatus(404);

        // Published form should succeed
        $response = $this->getJson('/api/public/forms/' . $publishedForm->slug);
        $response->assertStatus(200)
            ->assertJsonPath('form.title', 'Live Survey');
    }
}
