<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Campus extends Model
{
    use HasFactory;

    protected $table = 'campuses';
    protected $primaryKey = 'campus_id';
    public $timestamps = true;

    protected $fillable = [
        'name',
        'code',
        'location',
        'description',
    ];

    public function departments(): HasMany
    {
        return $this->hasMany(Department::class, 'campus_id', 'campus_id');
    }

    public function assets(): HasMany
    {
        return $this->hasMany(Asset::class, 'campus_id', 'campus_id');
    }
}
