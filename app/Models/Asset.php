<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Asset extends Model
{
    use HasFactory;

    protected $table = 'assets';
    protected $primaryKey = 'asset_id';
    public $timestamps = true;

    protected $fillable = [
        'cat_id',
        'campus_id',
        'dept_id',
        'supp_id',
        'serial_number',
        'name',
        'model',
        'description',
        'cost',
        'purchase_date',
        'warranty_expiry',
        'status',
        'image_url',
        'qr_code',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'warranty_expiry' => 'date',
        'cost' => 'decimal:2',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(AssetCategory::class, 'cat_id', 'cat_id');
    }

    public function campus(): BelongsTo
    {
        return $this->belongsTo(Campus::class, 'campus_id', 'campus_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'dept_id', 'dept_id');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supp_id', 'supp_id');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(AssetAssignment::class, 'asset_id', 'asset_id');
    }

    public function transfers(): HasMany
    {
        return $this->hasMany(AssetTransfer::class, 'asset_id', 'asset_id');
    }

    public function maintenance(): HasMany
    {
        return $this->hasMany(Maintenance::class, 'asset_id', 'asset_id');
    }

    public function disposal(): HasOne
    {
        return $this->hasOne(AssetDisposal::class, 'asset_id', 'asset_id');
    }

    public function purchaseItems(): HasMany
    {
        return $this->hasMany(PurchaseItem::class, 'asset_id', 'asset_id');
    }

    public function activeAssignment(): HasOne
    {
        return $this->hasOne(AssetAssignment::class, 'asset_id', 'asset_id')
                    ->where('status', 'Active');
    }

    public function isWarrantyExpired(): bool
    {
        return $this->warranty_expiry && $this->warranty_expiry < now();
    }

    public function daysUntilWarrantyExpiry(): ?int
    {
        return $this->warranty_expiry ? now()->diffInDays($this->warranty_expiry) : null;
    }
}
