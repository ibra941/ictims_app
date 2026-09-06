<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supplier extends Model
{
    use HasFactory;

    protected $table = 'suppliers';
    protected $primaryKey = 'supp_id';
    public $timestamps = true;

    protected $fillable = [
        'name',
        'contact_person',
        'phone',
        'email',
        'address',
        'tin',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function assets(): HasMany
    {
        return $this->hasMany(Asset::class, 'supp_id', 'supp_id');
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class, 'supp_id', 'supp_id');
    }
}
