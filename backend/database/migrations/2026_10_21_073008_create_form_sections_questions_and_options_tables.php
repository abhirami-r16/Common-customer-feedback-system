<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('form_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('feedback_form_id')->constrained('feedback_forms')->cascadeOnDelete();
            $table->string('title')->default('General Questions');
            $table->text('description')->nullable();
            $table->integer('position')->default(0);
            $table->timestamps();
        });

        Schema::create('form_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('form_section_id')->constrained('form_sections')->cascadeOnDelete();
            $table->text('question_text');
            $table->string('question_type'); // short_text, long_text, star_rating, numeric_rating, multiple_choice, checkboxes, dropdown, yes_no, email, date
            $table->boolean('is_required')->default(false);
            $table->json('settings')->nullable();
            $table->integer('position')->default(0);
            $table->timestamps();
        });

        Schema::create('question_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('form_question_id')->constrained('form_questions')->cascadeOnDelete();
            $table->string('option_text');
            $table->integer('position')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('question_options');
        Schema::dropIfExists('form_questions');
        Schema::dropIfExists('form_sections');
    }
};
