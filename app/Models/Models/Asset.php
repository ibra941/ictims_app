<?php

namespace App\Models\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Asset extends Model
{
    use HasFactory;

    protected $table = 'assets';
    protected $primaryKey = 'asset_id';
    public $timestamps = true;

    protected $fillable = [
        'cat_id', 'campus_id', 'dept_id', 'supp_id',
        'serial_number', 'name', 'model', 'description',
        'cost', 'purchase_date', 'warranty_expiry',
        'status', 'image_url', 'qr_code'
    ];

    // Relationships
    public function category()
    {
        return $this->belongsTo(AssetCategory::class, 'cat_id', 'cat_id');
    }

    public function campus()
    {
        return $this->belongsTo(Campus::class, 'campus_id', 'campus_id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class, 'dept_id', 'dept_id');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supp_id', 'supp_id');
    }

    public function currentAssignment()
    {
        return $this->hasOne(AssetAssignment::class, 'asset_id', 'asset_id')
                    ->where('status', 'Active');
    }

    public function assignments()
    {
        return $this->hasMany(AssetAssignment::class, 'asset_id', 'asset_id');
    }

    public function maintenance()
    {
        return $this->hasMany(Maintenance::class, 'asset_id', 'asset_id');
    }

    // Scopes
    public function scopeAvailable($query)
    {
        return $query->where('status', 'Available');
    }

    public function scopeAssigned($query)
    {
        return $query->where('status', 'Assigned');
    }

    public function scopeUnderMaintenance($query)
    {
        return $query->where('status', 'Under Maintenance');
    }

    // Accessor for formatted cost
    public function getFormattedCostAttribute()
    {
        return number_format($this->cost, 2);
    }

    // Check if warranty is valid
    public function getWarrantyStatusAttribute()
    {
        if (!$this->warranty_expiry) return 'No Warranty';
        
        $now = now();
        $expiry = \Carbon\Carbon::parse($this->warranty_expiry);
        
        if ($now->gt($expiry)) return 'Expired';
        if ($now->diffInDays($expiry) <= 30) return 'Expiring Soon';
        return 'Valid';
    }
}
