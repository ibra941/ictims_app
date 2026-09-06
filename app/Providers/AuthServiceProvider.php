<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Laravel\Sanctum\Sanctum;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        // 'App\Models\Model' => 'App\Policies\ModelPolicy',
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Custom user provider to handle password_hash field
        // This ensures Laravel uses the correct field for authentication
        \Illuminate\Support\Facades\Auth::provider('custom', function ($app, array $config) {
            return new \Illuminate\Auth\EloquentUserProvider(
                $app['hash'],
                $config['model']
            );
        });

        // Optional: Define gates for authorization
        Gate::define('admin', function ($user) {
            return $user->role_id === 1;
        });

        Gate::define('ict-officer', function ($user) {
            return $user->role_id === 2 || $user->role_id === 1;
        });

        Gate::define('department-head', function ($user) {
            return $user->role_id === 3 || $user->role_id === 1;
        });

        Gate::define('view-assets', function ($user) {
            return in_array($user->role_id, [1, 2, 3, 4, 5]);
        });

        Gate::define('manage-assets', function ($user) {
            return in_array($user->role_id, [1, 2]);
        });

        Gate::define('manage-users', function ($user) {
            return $user->role_id === 1;
        });
    }
}
