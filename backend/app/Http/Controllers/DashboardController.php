<?php

namespace App\Http\Controllers;

use App\Models\FeedbackForm;
use App\Models\FeedbackSubmission;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DashboardController extends Controller
{
    /**
     * Get aggregated metrics and recent items for the dashboard overview.
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        $days = (int) $request->query('days', 30);
        if (!in_array($days, [7, 30, 90])) {
            $days = 30;
        }

        $startDate = Carbon::now()->subDays($days)->startOfDay();

        // Forms statistics for authenticated user
        $userForms = $user->forms();
        $totalForms = (clone $userForms)->count();
        $publishedForms = (clone $userForms)->where('status', 'published')->count();
        $draftForms = (clone $userForms)->where('status', 'draft')->count();

        $formIds = (clone $userForms)->pluck('id');

        // Submissions statistics across user's forms
        $submissionsQuery = FeedbackSubmission::whereIn('feedback_form_id', $formIds);
        $totalResponses = (clone $submissionsQuery)->count();

        $avgRatingVal = (clone $submissionsQuery)->whereNotNull('rating')->avg('rating');
        $averageRating = $avgRatingVal !== null ? round((float) $avgRatingVal, 1) : null;
        $totalRatedResponses = (clone $submissionsQuery)->whereNotNull('rating')->count();

        // 1-5 Star Rating Distribution
        $ratingDistribution = [
            1 => 0,
            2 => 0,
            3 => 0,
            4 => 0,
            5 => 0,
        ];

        $ratingsCount = (clone $submissionsQuery)
            ->whereNotNull('rating')
            ->selectRaw('rating, count(*) as count')
            ->groupBy('rating')
            ->pluck('count', 'rating')
            ->all();

        foreach ($ratingsCount as $rating => $count) {
            $r = (int) $rating;
            if ($r >= 1 && $r <= 5) {
                $ratingDistribution[$r] = (int) $count;
            }
        }

        // Responses over time for the selected period
        $responsesInPeriod = (clone $submissionsQuery)
            ->where('created_at', '>=', $startDate)
            ->selectRaw('DATE(created_at) as date, count(*) as count')
            ->groupBy('date')
            ->pluck('count', 'date')
            ->all();

        // Build continuous date timeline
        $timeline = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $d = Carbon::now()->subDays($i)->format('Y-m-d');
            $timeline[] = [
                'date' => $d,
                'label' => Carbon::parse($d)->format('M d'),
                'count' => $responsesInPeriod[$d] ?? 0,
            ];
        }

        // Recent forms (latest 5)
        $recentForms = (clone $userForms)
            ->withCount('submissions')
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($form) {
                $lastSubmission = $form->submissions()->latest()->first();
                return [
                    'id' => $form->id,
                    'title' => $form->title,
                    'slug' => $form->slug,
                    'status' => $form->status,
                    'submissions_count' => $form->submissions_count,
                    'created_at' => $form->created_at->format('M d, Y'),
                    'last_response_at' => $lastSubmission ? $lastSubmission->created_at->format('M d, Y') : null,
                    'share_url' => url('/f/' . $form->slug),
                ];
            });

        // Recent responses (latest 5)
        $recentResponses = (clone $submissionsQuery)
            ->with('form:id,title')
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($sub) {
                return [
                    'id' => $sub->id,
                    'customer_name' => $sub->customer_name ?: 'Anonymous Customer',
                    'form_title' => $sub->form?->title ?: 'Feedback Form',
                    'rating' => $sub->rating,
                    'summary_preview' => $sub->summary_preview ?: 'No additional comments provided.',
                    'review_status' => $sub->review_status,
                    'created_at' => $sub->created_at->format('M d, Y'),
                ];
            });

        return response()->json([
            'metrics' => [
                'total_forms' => $totalForms,
                'published_forms' => $publishedForms,
                'draft_forms' => $draftForms,
                'total_responses' => $totalResponses,
                'average_rating' => $averageRating,
                'total_rated_responses' => $totalRatedResponses,
                'response_rate' => null, // Not available without direct campaign delivery denominator
                'response_rate_note' => 'Delivery logging is not applicable to open public forms.',
            ],
            'charts' => [
                'days' => $days,
                'timeline' => $timeline,
                'rating_distribution' => $ratingDistribution,
            ],
            'recent_forms' => $recentForms,
            'recent_responses' => $recentResponses,
        ]);
    }

    /**
     * Get paginated or searched forms for the user.
     */
    public function forms(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = $user->forms()->withCount('submissions');

        if ($search = $request->query('search')) {
            $query->where('title', 'like', "%{$search}%");
        }

        $forms = $query->latest()->paginate(10)->through(function ($form) {
            $lastSubmission = $form->submissions()->latest()->first();
            return [
                'id' => $form->id,
                'title' => $form->title,
                'description' => $form->description,
                'slug' => $form->slug,
                'status' => $form->status,
                'submissions_count' => $form->submissions_count,
                'created_at' => $form->created_at->format('M d, Y'),
                'last_response_at' => $lastSubmission ? $lastSubmission->created_at->format('M d, Y') : null,
                'share_url' => url('/f/' . $form->slug),
            ];
        });

        return response()->json($forms);
    }

    /**
     * Create a new form.
     */
    public function storeForm(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'in:draft,published,unpublished'],
        ]);

        $user = $request->user();
        $slug = Str::slug($validated['title']) . '-' . Str::lower(Str::random(6));

        $form = $user->forms()->create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'slug' => $slug,
            'status' => $validated['status'] ?? 'draft',
        ]);

        return response()->json([
            'message' => 'Feedback form created successfully.',
            'form' => $form,
        ], 201);
    }

    /**
     * Delete a form belonging to the authenticated user.
     */
    public function destroyForm(Request $request, int $id): JsonResponse
    {
        $form = $request->user()->forms()->find($id);

        if (!$form) {
            return response()->json(['message' => 'Feedback form not found.'], 404);
        }

        $form->delete();

        return response()->json([
            'message' => 'Feedback form deleted successfully.',
        ]);
    }

    /**
     * Get customer submissions/responses across user's forms with filters and ownership check.
     */
    public function responses(Request $request): JsonResponse
    {
        $user = $request->user();
        $formIds = $user->forms()->pluck('id');

        // If form_id filter was requested, verify ownership first
        if ($formId = $request->query('form_id')) {
            if (!$formIds->contains((int) $formId)) {
                return response()->json([
                    'message' => 'Unauthorized: You do not own the requested feedback form.',
                ], 403);
            }
        }

        $query = FeedbackSubmission::whereIn('feedback_form_id', $formIds)
            ->with('form:id,title,slug');

        if ($formId) {
            $query->where('feedback_form_id', $formId);
        }

        if ($rating = $request->query('rating')) {
            $query->where('rating', $rating);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                  ->orWhere('customer_email', 'like', "%{$search}%")
                  ->orWhere('summary_preview', 'like', "%{$search}%");
            });
        }

        $submissions = $query->latest()->paginate(15)->through(function ($sub) {
            $detailed = null;
            if ($sub->internal_notes) {
                $decoded = json_decode($sub->internal_notes, true);
                if (is_array($decoded)) {
                    $detailed = $decoded;
                }
            }

            return [
                'id' => $sub->id,
                'form_id' => $sub->feedback_form_id,
                'form_title' => $sub->form?->title ?: 'Feedback Form',
                'customer_name' => $sub->customer_name ?: 'Anonymous Customer',
                'customer_email' => $sub->customer_email,
                'rating' => $sub->rating,
                'summary_preview' => $sub->summary_preview ?: 'No comment provided.',
                'review_status' => $sub->review_status,
                'created_at' => $sub->created_at->format('M d, Y'),
                'created_at_relative' => $sub->created_at->diffForHumans(),
                'answers' => $detailed,
            ];
        });

        return response()->json($submissions);
    }

    /**
     * Get single customer response details, verifying form ownership.
     */
    public function showResponse(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $formIds = $user->forms()->pluck('id');

        $submission = FeedbackSubmission::with('form:id,title,slug,user_id')->find($id);

        if (!$submission) {
            return response()->json(['message' => 'Response not found.'], 404);
        }

        if (!$formIds->contains($submission->feedback_form_id)) {
            return response()->json([
                'message' => 'Unauthorized: You do not own the feedback form associated with this response.',
            ], 403);
        }

        $detailed = null;
        if ($submission->internal_notes) {
            $decoded = json_decode($submission->internal_notes, true);
            if (is_array($decoded)) {
                $detailed = $decoded;
            }
        }

        return response()->json([
            'id' => $submission->id,
            'form_id' => $submission->feedback_form_id,
            'form_title' => $submission->form?->title ?: 'Feedback Form',
            'form_slug' => $submission->form?->slug,
            'customer_name' => $submission->customer_name ?: 'Anonymous Customer',
            'customer_email' => $submission->customer_email,
            'rating' => $submission->rating,
            'summary_preview' => $submission->summary_preview ?: 'No comment provided.',
            'review_status' => $submission->review_status,
            'created_at' => $submission->created_at->format('M d, Y H:i'),
            'created_at_relative' => $submission->created_at->diffForHumans(),
            'answers' => $detailed,
        ]);
    }

    /**
     * Get responses for a specific form owned by the authenticated business user.
     */
    public function formResponses(Request $request, int $formId): JsonResponse
    {
        $user = $request->user();
        $form = FeedbackForm::find($formId);

        if (!$form) {
            return response()->json(['message' => 'Feedback form not found.'], 404);
        }

        if ($form->user_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized: You do not own this feedback form.',
            ], 403);
        }

        $query = $form->submissions();

        if ($rating = $request->query('rating')) {
            $query->where('rating', $rating);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                  ->orWhere('customer_email', 'like', "%{$search}%")
                  ->orWhere('summary_preview', 'like', "%{$search}%");
            });
        }

        $submissions = $query->latest()->paginate(15)->through(function ($sub) use ($form) {
            $detailed = null;
            if ($sub->internal_notes) {
                $decoded = json_decode($sub->internal_notes, true);
                if (is_array($decoded)) {
                    $detailed = $decoded;
                }
            }

            return [
                'id' => $sub->id,
                'form_id' => $form->id,
                'form_title' => $form->title,
                'customer_name' => $sub->customer_name ?: 'Anonymous Customer',
                'customer_email' => $sub->customer_email,
                'rating' => $sub->rating,
                'summary_preview' => $sub->summary_preview ?: 'No comment provided.',
                'review_status' => $sub->review_status,
                'created_at' => $sub->created_at->format('M d, Y'),
                'created_at_relative' => $sub->created_at->diffForHumans(),
                'answers' => $detailed,
            ];
        });

        return response()->json([
            'form' => [
                'id' => $form->id,
                'title' => $form->title,
                'slug' => $form->slug,
                'status' => $form->status,
            ],
            'submissions' => $submissions,
        ]);
    }

    /**
     * Delete a customer response belonging to one of the authenticated user's forms.
     */
    public function destroyResponse(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $formIds = $user->forms()->pluck('id');

        $submission = FeedbackSubmission::find($id);

        if (!$submission) {
            return response()->json(['message' => 'Response not found.'], 404);
        }

        if (!$formIds->contains($submission->feedback_form_id)) {
            return response()->json([
                'message' => 'Unauthorized: You do not own the feedback form associated with this response.',
            ], 403);
        }

        $submission->delete();

        return response()->json([
            'message' => 'Response deleted successfully.',
        ]);
    }
}
