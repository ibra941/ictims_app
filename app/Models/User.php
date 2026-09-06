<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'users';
    protected $primaryKey = 'user_id';
    public $timestamps = true;

    protected $fillable = [
        'emp_id',
        'role_id',
        'username',
        'password',
        'password_hash',
        'email',
        'ip_address',
        'last_login',
        'is_active'
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_login' => 'datetime',
    ];

    // Support both the legacy password_hash column and the current password column.
    public function getAuthPassword()
    {
        return $this->password_hash ?? $this->password ?? null;
    }

    public function getPasswordHashAttribute()
    {
        return $this->attributes['password_hash'] ?? $this->attributes['password'] ?? null;
    }

    // Laravel expects 'name' for display, we'll use first_name + last_name
    public function getNameAttribute()
    {
        $firstName = $this->first_name ?? null;
        $lastName = $this->last_name ?? null;
        $combined = trim(($firstName ?: '') . ' ' . ($lastName ?: ''));
        return $combined !== '' ? $combined : ($this->username ?? $this->email ?? 'User');
    }

    // Relationships
    public function employee()
    {
        return $this->belongsTo(Employee::class, 'emp_id', 'emp_id');
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id', 'role_id');
    }

    // Accessor for full name
    public function getFullNameAttribute()
    {
        $firstName = $this->first_name ?? null;
        $lastName = $this->last_name ?? null;
        $combined = trim(($firstName ?: '') . ' ' . ($lastName ?: ''));
        return $combined !== '' ? $combined : ($this->username ?? $this->email ?? 'User');
    }

    // Check if user has a specific role.
    // Accept both the canonical IAA names and legacy aliases used across older screens.
    public function hasRole($roleName)
    {
        if (!$this->role || !$roleName) {
            return false;
        }

        $current = strtolower(trim($this->role->name ?? ''));
        $target = strtolower(trim((string) $roleName));

        $aliases = [
            'overall administrator' => ['overall administrator', 'system administrator', 'super admin'],
            'campus administrator' => ['campus administrator', 'campus admin'],
            'ict officer' => ['ict officer', 'asset officer'],
            'procurement officer' => ['procurement officer', 'procurement admin'],
            'head of department' => ['head of department', 'department head', 'unit approver'],
            'lab manager' => ['lab manager'],
            'employee' => ['employee'],
        ];

        $normalizedTarget = preg_replace('/\s+/', ' ', $target);
        $normalizedCurrent = preg_replace('/\s+/', ' ', $current);

        if ($normalizedTarget === $normalizedCurrent) {
            return true;
        }

        foreach ($aliases as $canonical => $names) {
            if (in_array($normalizedTarget, array_map('strtolower', $names), true)) {
                if ($normalizedCurrent === $canonical || in_array($normalizedCurrent, array_map('strtolower', $names), true)) {
                    return true;
                }
            }
        }

        return false;
    }

    // Check if user has a specific permission
    public function hasPermission($module, $action)
    {
        if (!$this->role) {
            return false;
        }
        
        return $this->role->permissions()
            ->where(function ($query) use ($module) {
                $query->where('module', $module)
                    ->orWhere('module', '*');
            })
            ->where(function ($query) use ($action) {
                $query->where('action', $action)
                    ->orWhere('action', 'manage')
                    ->orWhere('action', '*');
            })
            ->exists();
    }
}
