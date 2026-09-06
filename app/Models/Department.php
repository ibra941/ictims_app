<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    use HasFactory;

    protected $table = 'departments';
    protected $primaryKey = 'dept_id';
    public $timestamps = true;

    protected $fillable = [
        'campus_id',
        'name',
        'code',
        'description',
    ];

    public function campus(): BelongsTo
    {
        return $this->belongsTo(Campus::class, 'campus_id', 'campus_id');
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class, 'dept_id', 'dept_id');
    }

    public function assets(): HasMany
    {
        return $this->hasMany(Asset::class, 'dept_id', 'dept_id');
    }
}
