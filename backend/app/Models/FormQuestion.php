<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FormQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'form_section_id',
        'question_text',
        'question_type',
        'is_required',
        'settings',
        'position',
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'settings' => 'array',
        'position' => 'integer',
    ];

    public function section(): BelongsTo
    {
        return $this->belongsTo(FormSection::class, 'form_section_id');
    }

    public function options(): HasMany
    {
        return $this->hasMany(QuestionOption::class, 'form_question_id')->orderBy('position');
    }
}
