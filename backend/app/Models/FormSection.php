<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FormSection extends Model
{
    use HasFactory;

    protected $fillable = [
        'feedback_form_id',
        'title',
        'description',
        'position',
    ];

    public function form(): BelongsTo
    {
        return $this->belongsTo(FeedbackForm::class, 'feedback_form_id');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(FormQuestion::class, 'form_section_id')->orderBy('position');
    }
}
