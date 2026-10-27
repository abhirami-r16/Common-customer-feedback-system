<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ProvisionAdminCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:provision-admin {--password= : Optional password for the administrator account}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Provision or promote the designated administrator account based on ADMIN_EMAIL';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $adminEmail = config('app.admin_email', env('ADMIN_EMAIL'));

        if (!$adminEmail) {
            $this->error('ADMIN_EMAIL is not configured in your environment.');
            return self::FAILURE;
        }

        $user = User::where('email', $adminEmail)->first();

        if ($user) {
            $user->role = User::ROLE_ADMIN;
            if ($password = $this->option('password')) {
                $user->password = Hash::make($password);
            }
            $user->save();
            $this->info("User [{$adminEmail}] promoted to Administrator successfully.");
        } else {
            $password = $this->option('password') ?: env('ADMIN_INITIAL_PASSWORD', 'admin123');
            $user = User::create([
                'name' => 'System Administrator',
                'email' => $adminEmail,
                'password' => Hash::make($password),
                'organization_name' => 'FeedbackHub Platform',
                'role' => User::ROLE_ADMIN,
            ]);
            $this->info("Administrator account [{$adminEmail}] provisioned successfully.");
        }

        return self::SUCCESS;
    }
}
