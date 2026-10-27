<?php

namespace App\Http\Controllers;

use App\Models\FeedbackForm;
use App\Models\FormQuestion;
use App\Models\FormSection;
use App\Models\QuestionOption;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FormBuilderController extends Controller
{
    /**
     * Get complete nested structure of a form owned by the authenticated user.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $form = FeedbackForm::find($id);

        if (!$form) {
            return response()->json(['message' => 'Feedback form not found.'], 404);
        }

        if ($form->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized: You do not own this feedback form.',
            ], 403);
        }

        $form->load(['sections.questions.options']);

        return response()->json([
            'form' => $form,
            'data' => $form,
        ]);
    }

    /**
     * Save (create or update) complete nested form structure in a transaction.
     */
    public function save(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id' => ['nullable', 'integer'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:draft,published,unpublished'],
            'sections' => ['required', 'array', 'min:1'],
            'sections.*.id' => ['nullable', 'integer'],
            'sections.*.title' => ['required', 'string', 'max:255'],
            'sections.*.description' => ['nullable', 'string'],
            'sections.*.position' => ['nullable', 'integer'],
            'sections.*.questions' => ['nullable', 'array'],
            'sections.*.questions.*.id' => ['nullable', 'integer'],
            'sections.*.questions.*.question_text' => ['required', 'string'],
            'sections.*.questions.*.question_type' => ['required', 'string'],
            'sections.*.questions.*.is_required' => ['boolean'],
            'sections.*.questions.*.settings' => ['nullable', 'array'],
            'sections.*.questions.*.position' => ['nullable', 'integer'],
            'sections.*.questions.*.options' => ['nullable', 'array'],
            'sections.*.questions.*.options.*.id' => ['nullable', 'integer'],
            'sections.*.questions.*.options.*.option_text' => ['required', 'string'],
            'sections.*.questions.*.options.*.position' => ['nullable', 'integer'],
        ]);

        $user = $request->user();

        // Enforce validation for choice-based questions: they must have at least 1 valid option
        foreach ($validated['sections'] as $secIndex => $section) {
            foreach ($section['questions'] ?? [] as $qIndex => $question) {
                $type = $question['question_type'];
                if (in_array($type, ['multiple_choice', 'checkboxes', 'dropdown'])) {
                    $options = $question['options'] ?? [];
                    if (empty($options)) {
                        return response()->json([
                            'message' => "Question \"{$question['question_text']}\" requires at least one answer option.",
                            'errors' => [
                                "sections.{$secIndex}.questions.{$qIndex}.options" => ["At least one answer option is required."],
                            ],
                        ], 422);
                    }
                }
            }
        }

        if (!empty($validated['id'])) {
            $existing = FeedbackForm::find($validated['id']);
            if (!$existing) {
                return response()->json(['message' => 'Feedback form not found.'], 404);
            }
            if ($existing->user_id !== $user->id) {
                return response()->json([
                    'message' => 'Unauthorized: You do not own this feedback form.',
                ], 403);
            }
        }

        $form = DB::transaction(function () use ($user, $validated) {
            // 1. Create or update Form
            if (!empty($validated['id'])) {
                $form = $user->forms()->findOrFail($validated['id']);
                $form->update([
                    'title' => $validated['title'],
                    'description' => $validated['description'] ?? null,
                    'status' => $validated['status'],
                ]);
            } else {
                $slug = Str::slug($validated['title']) . '-' . Str::lower(Str::random(6));
                $form = $user->forms()->create([
                    'title' => $validated['title'],
                    'description' => $validated['description'] ?? null,
                    'slug' => $slug,
                    'status' => $validated['status'],
                ]);
            }

            // Keep track of current IDs to clean up deleted entities
            $incomingSectionIds = [];
            $incomingQuestionIds = [];
            $incomingOptionIds = [];

            // 2. Process Sections
            foreach ($validated['sections'] as $sIndex => $secData) {
                $section = null;
                if (!empty($secData['id'])) {
                    $section = $form->sections()->where('id', $secData['id'])->first();
                }

                if ($section) {
                    $section->update([
                        'title' => $secData['title'],
                        'description' => $secData['description'] ?? null,
                        'position' => $secData['position'] ?? $sIndex,
                    ]);
                } else {
                    $section = $form->sections()->create([
                        'title' => $secData['title'],
                        'description' => $secData['description'] ?? null,
                        'position' => $secData['position'] ?? $sIndex,
                    ]);
                }
                $incomingSectionIds[] = $section->id;

                // 3. Process Questions inside Section
                foreach ($secData['questions'] ?? [] as $qIndex => $qData) {
                    $question = null;
                    if (!empty($qData['id'])) {
                        $question = $section->questions()->where('id', $qData['id'])->first();
                    }

                    $qPayload = [
                        'question_text' => $qData['question_text'],
                        'question_type' => $qData['question_type'],
                        'is_required' => $qData['is_required'] ?? false,
                        'settings' => $qData['settings'] ?? null,
                        'position' => $qData['position'] ?? $qIndex,
                    ];

                    if ($question) {
                        $question->update($qPayload);
                    } else {
                        $question = $section->questions()->create($qPayload);
                    }
                    $incomingQuestionIds[] = $question->id;

                    // 4. Process Question Options (if applicable)
                    if (in_array($qData['question_type'], ['multiple_choice', 'checkboxes', 'dropdown'])) {
                        foreach ($qData['options'] ?? [] as $oIndex => $optData) {
                            $option = null;
                            if (!empty($optData['id'])) {
                                $option = $question->options()->where('id', $optData['id'])->first();
                            }

                            if ($option) {
                                $option->update([
                                    'option_text' => $optData['option_text'],
                                    'position' => $optData['position'] ?? $oIndex,
                                ]);
                            } else {
                                $option = $question->options()->create([
                                    'option_text' => $optData['option_text'],
                                    'position' => $optData['position'] ?? $oIndex,
                                ]);
                            }
                            $incomingOptionIds[] = $option->id;
                        }
                    }
                }
            }

            // Cleanup deleted items
            $form->sections()->whereNotIn('id', $incomingSectionIds)->delete();
            FormQuestion::whereIn('form_section_id', $incomingSectionIds)
                ->whereNotIn('id', $incomingQuestionIds)
                ->delete();
            QuestionOption::whereIn('form_question_id', $incomingQuestionIds)
                ->whereNotIn('id', $incomingOptionIds)
                ->delete();

            return $form->load(['sections.questions.options']);
        });

        $actionText = $form->status === 'published' ? 'published' : 'saved as draft';

        return response()->json([
            'message' => "Form successfully {$actionText}.",
            'form' => $form,
            'data' => $form,
            'share_url' => url('/f/' . $form->slug),
        ]);
    }

    /**
     * Quick status update (publish / unpublish / draft).
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:draft,published,unpublished'],
        ]);

        $form = FeedbackForm::find($id);

        if (!$form) {
            return response()->json(['message' => 'Feedback form not found.'], 404);
        }

        if ($form->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized: You do not own this feedback form.',
            ], 403);
        }

        $form->update(['status' => $validated['status']]);

        return response()->json([
            'message' => 'Form status updated successfully.',
            'status' => $form->status,
        ]);
    }

    /**
     * Public endpoint to view a form.
     */
    public function publicView(Request $request, string $slug): JsonResponse
    {
        $form = FeedbackForm::where('slug', $slug)
            ->with(['sections.questions.options', 'user'])
            ->firstOrFail();

        $clientToken = $request->query('client_token');
        $alreadySubmitted = false;
        if (!empty($clientToken)) {
            $alreadySubmitted = $form->submissions()->where('client_token', $clientToken)->exists();
        }

        $formData = [
            'id' => $form->id,
            'title' => $form->title,
            'description' => $form->description,
            'slug' => $form->slug,
            'already_submitted' => $alreadySubmitted,
            'user' => [
                'business_name' => $form->user?->organization_name ?? $form->user?->name ?? 'Customer Feedback',
            ],
            'sections' => $form->sections,
        ];

        return response()->json([
            'form' => $formData,
            'data' => $formData,
        ]);
    }

    /**
     * Public endpoint to submit customer feedback response.
     */
    public function submitFeedback(Request $request, string $slug): JsonResponse
    {
        $form = FeedbackForm::where('slug', $slug)
            ->with(['sections.questions'])
            ->firstOrFail();

        $answers = $request->input('answers', []);
        $customerName = $request->input('customer_name');
        $customerEmail = $request->input('customer_email');
        $clientToken = $request->input('client_token');
        $ip = $request->ip();
        $rating = null;
        $summaryParts = [];

        $detailedAnswers = [];
        foreach ($form->sections as $sec) {
            foreach ($sec->questions as $q) {
                if (isset($answers[$q->id])) {
                    $ans = $answers[$q->id];
                    $ansStr = is_array($ans) ? implode(', ', $ans) : (string)$ans;
                    $summaryParts[] = "{$q->question_text}: {$ansStr}";
                    $detailedAnswers[] = [
                        'question' => $q->question_text,
                        'type' => $q->question_type,
                        'answer' => $ans,
                    ];

                    if ($q->question_type === 'star_rating' || $q->question_type === 'numeric_rating') {
                        if ($rating === null && is_numeric($ans)) {
                            $rating = (int)$ans;
                        }
                    } elseif ($q->question_type === 'email' && empty($customerEmail)) {
                        $customerEmail = filter_var($ans, FILTER_VALIDATE_EMAIL) ? $ans : null;
                    } elseif ($q->question_type === 'short_text' && empty($customerName) && stripos($q->question_text, 'name') !== false) {
                        $customerName = substr($ans, 0, 100);
                    }
                }
            }
        }

        // Prevent multiple submissions by the same user
        $alreadySubmitted = $form->submissions()
            ->where(function ($query) use ($clientToken, $customerEmail) {
                $hasCriteria = false;
                if (!empty($clientToken)) {
                    $query->where('client_token', $clientToken);
                    $hasCriteria = true;
                }
                if (!empty($customerEmail)) {
                    $cleanEmail = strtolower(trim($customerEmail));
                    if ($hasCriteria) {
                        $query->orWhere('customer_email', $cleanEmail);
                    } else {
                        $query->where('customer_email', $cleanEmail);
                        $hasCriteria = true;
                    }
                }
                if (!$hasCriteria) {
                    $query->whereRaw('1 = 0');
                }
            })
            ->exists();

        if ($alreadySubmitted) {
            return response()->json([
                'message' => 'You have already submitted a response for this feedback form. Each user can submit only once.',
                'already_submitted' => true,
            ], 422);
        }

        $submission = $form->submissions()->create([
            'customer_name' => $customerName ?: 'Anonymous Customer',
            'customer_email' => $customerEmail ? strtolower(trim($customerEmail)) : null,
            'ip_address' => $ip,
            'client_token' => $clientToken,
            'rating' => $rating ?: 5,
            'summary_preview' => implode(' | ', array_slice($summaryParts, 0, 3)),
            'review_status' => 'new',
            'internal_notes' => json_encode($detailedAnswers),
        ]);

        return response()->json([
            'message' => 'Thank you! Your feedback has been successfully submitted.',
            'submission_id' => $submission->id,
            'already_submitted' => true,
        ]);
    }
}
