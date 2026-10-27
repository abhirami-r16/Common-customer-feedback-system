<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $adminEmail = config('app.admin_email', env('ADMIN_EMAIL', 'admin@gmail.com'));

        // Normalize roles: user -> business, any non-admin email -> business
        DB::table('users')
            ->where('role', 'user')
            ->update(['role' => 'business']);

        // Ensure users who are not the configured admin email are designated as business accounts
        if ($adminEmail) {
            DB::table('users')
                ->where('email', '!=', $adminEmail)
                ->where('role', 'admin')
                ->update(['role' => 'business']);

            DB::table('users')
                ->where('email', $adminEmail)
                ->update(['role' => 'admin']);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('users')
            ->where('role', 'business')
            ->update(['role' => 'user']);
    }
};
