<?php

namespace App\Models\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    use HasFactory;

    protected $table = 'roles';
    protected $primaryKey = 'role_id';
    public $timestamps = true;

    protected $fillable = [
        'name',
        'description'
    ];

    // Relationships
    public function permissions()
    {
        return $this->hasMany(Permission::class, 'role_id', 'role_id');
    }

    public function users()
    {
        return $this->hasMany(\App\Models\User::class, 'role_id', 'role_id');
    }
}
