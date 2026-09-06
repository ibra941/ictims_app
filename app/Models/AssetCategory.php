<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssetCategory extends Model
{
    use HasFactory;

    protected $table = 'asset_categories';
    protected $primaryKey = 'cat_id';
    public $timestamps = true;

    protected $fillable = [
        'name',
        'code',
        'type',
        'description',
    ];

    public function assets(): HasMany
    {
        return $this->hasMany(Asset::class, 'cat_id', 'cat_id');
    }
}
