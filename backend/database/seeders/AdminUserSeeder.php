<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminEmail = config('app.admin_email', env('ADMIN_EMAIL', 'admin@gmail.com'));

        User::updateOrCreate(
            ['email' => $adminEmail],
            [
                'name' => 'System Administrator',
                'password' => Hash::make(env('ADMIN_INITIAL_PASSWORD', 'admin123')),
                'organization_name' => 'FeedbackHub Platform',
                'role' => User::ROLE_ADMIN,
            ]
        );
    }
}
