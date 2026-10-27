<?php

namespace App\Http\Controllers;

use App\Models\FeedbackForm;
use App\Models\FeedbackSubmission;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * Ensure the authenticated user has the admin role.
     */
    protected function ensureAdmin(Request $request): void
    {
        if (!$request->user() || !$request->user()->isAdmin()) {
            abort(403, 'Unauthorized: Platform Administrator privileges required.');
        }
    }

    /**
     * Platform-wide aggregated statistics for the Super Admin overview.
     */
    public function stats(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $days = (int) $request->query('days', 30);
        if (!in_array($days, [7, 30, 90])) {
            $days = 30;
        }

        $startDate = Carbon::now()->subDays($days)->startOfDay();

        $totalUsers = User::count();
        $totalBusinessUsers = User::where('role', 'business')->count();
        $adminCount = User::where('role', 'admin')->count();
        $totalForms = FeedbackForm::count();
        $publishedForms = FeedbackForm::where('status', 'published')->count();
        $draftForms = FeedbackForm::where('status', 'draft')->count();

        $submissionsQuery = FeedbackSubmission::query();
        $totalResponses = (clone $submissionsQuery)->count();
        $avgRatingVal = (clone $submissionsQuery)->whereNotNull('rating')->avg('rating');
        $averageRating = $avgRatingVal !== null ? round((float) $avgRatingVal, 1) : null;
        $totalRatedResponses = (clone $submissionsQuery)->whereNotNull('rating')->count();

        // 1-5 Star Rating Distribution across platform
        $ratingDistribution = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];
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

        // Response activity timeline
        $responsesInPeriod = (clone $submissionsQuery)
            ->where('created_at', '>=', $startDate)
            ->selectRaw('DATE(created_at) as date, count(*) as count')
            ->groupBy('date')
            ->pluck('count', 'date')
            ->all();

        $timeline = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $d = Carbon::now()->subDays($i)->format('Y-m-d');
            $timeline[] = [
                'date' => $d,
                'label' => Carbon::parse($d)->format('M d'),
                'count' => $responsesInPeriod[$d] ?? 0,
            ];
        }

        // Recent users
        $recentUsers = User::withCount(['forms', 'submissions'])
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'organization_name' => $u->organization_name,
                    'role' => $u->role,
                    'forms_count' => $u->forms_count,
                    'submissions_count' => $u->submissions_count,
                    'created_at' => $u->created_at->format('M d, Y'),
                ];
            });

        // Recent forms across all organizations
        $recentForms = FeedbackForm::with('user:id,name,organization_name')
            ->withCount('submissions')
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($f) {
                return [
                    'id' => $f->id,
                    'title' => $f->title,
                    'slug' => $f->slug,
                    'status' => $f->status,
                    'submissions_count' => $f->submissions_count,
                    'organization' => $f->user?->organization_name ?: 'System',
                    'created_at' => $f->created_at->format('M d, Y'),
                    'share_url' => url('/f/' . $f->slug),
                ];
            });

        // Recent responses platform-wide
        $recentResponses = FeedbackSubmission::with(['form:id,title,user_id', 'form.user:id,organization_name'])
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($sub) {
                return [
                    'id' => $sub->id,
                    'customer_name' => $sub->customer_name ?: 'Anonymous Customer',
                    'customer_email' => $sub->customer_email,
                    'form_title' => $sub->form?->title ?: 'Feedback Form',
                    'organization' => $sub->form?->user?->organization_name ?: 'Unknown',
                    'rating' => $sub->rating,
                    'summary_preview' => $sub->summary_preview ?: 'No comment provided.',
                    'created_at' => $sub->created_at->format('M d, Y'),
                ];
            });

        return response()->json([
            'metrics' => [
                'total_business_users' => $totalBusinessUsers,
                'total_users' => $totalUsers,
                'admin_users' => $adminCount,
                'total_forms' => $totalForms,
                'published_forms' => $publishedForms,
                'draft_forms' => $draftForms,
                'total_responses' => $totalResponses,
                'average_rating' => $averageRating,
                'total_rated_responses' => $totalRatedResponses,
            ],
            'charts' => [
                'days' => $days,
                'timeline' => $timeline,
                'rating_distribution' => $ratingDistribution,
            ],
            'recent_users' => $recentUsers,
            'recent_forms' => $recentForms,
            'recent_responses' => $recentResponses,
        ]);
    }

    /**
     * List all platform users with counts, search, and role filters.
     */
    public function users(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $query = User::withCount(['forms', 'submissions']);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('organization_name', 'like', "%{$search}%");
            });
        }

        if ($role = $request->query('role')) {
            $query->where('role', $role);
        }

        $users = $query->latest()->paginate(15)->through(function ($u) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'organization_name' => $u->organization_name,
                'role' => $u->role,
                'forms_count' => $u->forms_count,
                'submissions_count' => $u->submissions_count,
                'created_at' => $u->created_at->format('M d, Y'),
                'created_at_relative' => $u->created_at->diffForHumans(),
            ];
        });

        return response()->json($users);
    }

    /**
     * Get featured / top active platform users for sidebar quick access.
     */
    public function featuredUsers(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $limit = (int) $request->query('limit', 5);
        if ($limit < 1 || $limit > 20) {
            $limit = 5;
        }

        $users = User::withCount(['forms', 'submissions'])
            ->orderByDesc('submissions_count')
            ->orderByDesc('forms_count')
            ->latest()
            ->take($limit)
            ->get()
            ->map(function ($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'organization_name' => $u->organization_name,
                    'role' => $u->role,
                    'forms_count' => $u->forms_count,
                    'submissions_count' => $u->submissions_count,
                    'created_at' => $u->created_at->format('M d, Y'),
                ];
            });

        return response()->json([
            'featured_users' => $users,
            'total_users' => User::count(),
        ]);
    }

    /**
     * Get single user full details along with all their created forms and customer responses.
     */
    public function showUser(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);

        $user = User::withCount(['forms', 'submissions'])->findOrFail($id);

        // Forms created by this user
        $forms = FeedbackForm::where('user_id', $user->id)
            ->withCount('submissions')
            ->latest()
            ->get()
            ->map(function ($form) {
                $lastSubmission = $form->submissions()->latest()->first();
                $avgRating = round((float) $form->submissions()->whereNotNull('rating')->avg('rating'), 1);

                return [
                    'id' => $form->id,
                    'user_id' => $form->user_id,
                    'title' => $form->title,
                    'description' => $form->description,
                    'slug' => $form->slug,
                    'status' => $form->status,
                    'submissions_count' => $form->submissions_count,
                    'average_rating' => $avgRating ?: null,
                    'created_at' => $form->created_at->format('M d, Y'),
                    'created_at_relative' => $form->created_at->diffForHumans(),
                    'last_response_at' => $lastSubmission ? $lastSubmission->created_at->format('M d, Y') : null,
                    'share_url' => url('/f/' . $form->slug),
                ];
            });

        // Responses created/received for this user's forms
        $submissionsQuery = FeedbackSubmission::whereHas('form', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->with('form:id,title,slug');

        $totalResponses = (clone $submissionsQuery)->count();
        $avgRatingVal = (clone $submissionsQuery)->whereNotNull('rating')->avg('rating');
        $averageRating = $avgRatingVal !== null ? round((float) $avgRatingVal, 1) : null;
        $totalRatedResponses = (clone $submissionsQuery)->whereNotNull('rating')->count();

        // 1-5 Star Rating Distribution
        $ratingDistribution = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];
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

        $responses = $submissionsQuery
            ->latest()
            ->get()
            ->map(function ($sub) {
                $detailed = null;
                if ($sub->internal_notes) {
                    $decoded = json_decode($sub->internal_notes, true);
                    if (is_array($decoded)) {
                        $detailed = $decoded;
                    }
                }

                return [
                    'id' => $sub->id,
                    'feedback_form_id' => $sub->feedback_form_id,
                    'form_title' => $sub->form?->title ?: 'Feedback Form',
                    'form_slug' => $sub->form?->slug,
                    'customer_name' => $sub->customer_name ?: 'Anonymous Customer',
                    'customer_email' => $sub->customer_email,
                    'rating' => $sub->rating,
                    'summary_preview' => $sub->summary_preview ?: 'No comment provided.',
                    'review_status' => $sub->review_status,
                    'created_at' => $sub->created_at->format('M d, Y H:i'),
                    'created_at_relative' => $sub->created_at->diffForHumans(),
                    'answers' => $detailed,
                ];
            });

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'organization_name' => $user->organization_name,
                'role' => $user->role,
                'forms_count' => $user->forms_count,
                'submissions_count' => $totalResponses,
                'average_rating' => $averageRating,
                'created_at' => $user->created_at->format('M d, Y'),
                'created_at_relative' => $user->created_at->diffForHumans(),
            ],
            'metrics' => [
                'total_forms' => $forms->count(),
                'published_forms' => $forms->where('status', 'published')->count(),
                'draft_forms' => $forms->where('status', 'draft')->count(),
                'total_responses' => $totalResponses,
                'average_rating' => $averageRating,
                'total_rated_responses' => $totalRatedResponses,
                'rating_distribution' => $ratingDistribution,
            ],
            'forms' => $forms,
            'responses' => $responses,
        ]);
    }

    /**
     * Update user role (e.g. promote to admin or demote to user).
     */
    public function updateUserRole(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'role' => ['required', 'string', 'in:business,admin,user'],
        ]);

        $roleToSet = $validated['role'] === 'user' ? 'business' : $validated['role'];

        $user = User::findOrFail($id);

        // Safety: If demoting self, make sure another admin exists
        if ($user->id === $request->user()->id && $roleToSet !== 'admin') {
            $otherAdmins = User::where('role', 'admin')->where('id', '!=', $user->id)->count();
            if ($otherAdmins === 0) {
                return response()->json([
                    'message' => 'Cannot revoke your own admin rights because you are the only administrator.',
                ], 422);
            }
        }

        $user->role = $roleToSet;
        $user->save();

        return response()->json([
            'message' => "User role updated to {$user->role} successfully.",
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'organization_name' => $user->organization_name,
                'role' => $user->role,
            ],
        ]);
    }

    /**
     * Delete user and all associated forms/submissions.
     */
    public function deleteUser(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);

        if ($request->user()->id === $id) {
            return response()->json([
                'message' => 'You cannot delete your own administrator account.',
            ], 422);
        }

        $user = User::findOrFail($id);

        // Delete user's forms (cascade relations)
        foreach ($user->forms as $form) {
            $form->submissions()->delete();
            $form->sections()->delete();
            $form->delete();
        }

        $user->delete();

        return response()->json([
            'message' => 'User and all associated feedback data deleted successfully.',
        ]);
    }

    /**
     * List all platform forms across all tenants with search and status filters.
     */
    public function forms(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $query = FeedbackForm::with('user:id,name,email,organization_name')
            ->withCount('submissions');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('organization_name', 'like', "%{$search}%");
                  });
            });
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $forms = $query->latest()->paginate(15)->through(function ($form) {
            $lastSubmission = $form->submissions()->latest()->first();
            $avgRating = round((float) $form->submissions()->whereNotNull('rating')->avg('rating'), 1);

            return [
                'id' => $form->id,
                'user_id' => $form->user_id,
                'title' => $form->title,
                'description' => $form->description,
                'slug' => $form->slug,
                'status' => $form->status,
                'organization_name' => $form->user?->organization_name ?: 'System',
                'owner_name' => $form->user?->name ?: 'Unknown',
                'owner_email' => $form->user?->email,
                'submissions_count' => $form->submissions_count,
                'average_rating' => $avgRating ?: null,
                'created_at' => $form->created_at->format('M d, Y'),
                'last_response_at' => $lastSubmission ? $lastSubmission->created_at->format('M d, Y') : null,
                'share_url' => url('/f/' . $form->slug),
            ];
        });

        return response()->json($forms);
    }

    /**
     * List all customer submissions platform-wide with filters.
     */
    public function responses(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $query = FeedbackSubmission::with(['form:id,title,slug,user_id', 'form.user:id,name,organization_name']);

        if ($rating = $request->query('rating')) {
            $query->where('rating', $rating);
        }

        if ($formId = $request->query('form_id')) {
            $query->where('feedback_form_id', $formId);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                  ->orWhere('customer_email', 'like', "%{$search}%")
                  ->orWhere('summary_preview', 'like', "%{$search}%")
                  ->orWhereHas('form', function ($fq) use ($search) {
                      $fq->where('title', 'like', "%{$search}%");
                  });
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
                'user_id' => $sub->form?->user_id,
                'owner_name' => $sub->form?->user?->name ?: 'Unknown',
                'form_title' => $sub->form?->title ?: 'Feedback Form',
                'form_slug' => $sub->form?->slug,
                'organization_name' => $sub->form?->user?->organization_name ?: 'Platform',
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
     * Delete any response platform-wide.
     */
    public function destroyResponse(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);

        $submission = FeedbackSubmission::findOrFail($id);
        $submission->delete();

        return response()->json([
            'message' => 'Response deleted successfully by administrator.',
        ]);
    }

    /**
     * Delete any feedback form platform-wide by administrator.
     */
    public function destroyForm(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);

        $form = FeedbackForm::findOrFail($id);

        foreach ($form->sections as $section) {
            foreach ($section->questions as $question) {
                $question->options()->delete();
                $question->delete();
            }
            $section->delete();
        }
        $form->submissions()->delete();
        $form->delete();

        return response()->json([
            'message' => 'Feedback form and all associated responses deleted successfully.',
        ]);
    }
}

