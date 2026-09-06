<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RoleCompatibilityTest extends TestCase
{
    public function test_overall_admin_aliases_are_accepted_for_legacy_role_checks(): void
    {
        $role = new Role([
            'role_id' => 1,
            'name' => 'Overall Administrator',
            'description' => 'Global system owner',
        ]);

        $user = new User([
            'user_id' => 1,
            'username' => 'alias-admin',
            'email' => 'alias-admin@example.com',
            'password' => Hash::make('password'),
            'role_id' => 1,
            'is_active' => true,
        ]);
        $user->setRelation('role', $role);

        $this->assertTrue($user->hasRole('Overall Administrator'));
        $this->assertTrue($user->hasRole('System Administrator'));
        $this->assertTrue($user->hasRole('overall administrator'));
    }
}
