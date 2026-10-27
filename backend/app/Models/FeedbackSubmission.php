<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeedbackSubmission extends Model
{
    use HasFactory;

    protected $fillable = [
        'feedback_form_id',
        'customer_name',
        'customer_email',
        'rating',
        'summary_preview',
        'review_status',
        'internal_notes',
        'ip_address',
        'client_token',
    ];

    public function form(): BelongsTo
    {
        return $this->belongsTo(FeedbackForm::class, 'feedback_form_id');
    }
}
