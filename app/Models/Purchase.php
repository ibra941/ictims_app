<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Purchase extends Model
{
    use HasFactory;

    protected $table = 'purchases';
    protected $primaryKey = 'purch_id';
    public $timestamps = true;

    protected $fillable = [
        'supp_id',
        'po_number',
        'purch_date',
        'expected_delivery',
        'total_amount',
        'status',
        'notes',
    ];

    protected $casts = [
        'purch_date' => 'date',
        'expected_delivery' => 'date',
        'total_amount' => 'decimal:2',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supp_id', 'supp_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseItem::class, 'purch_id', 'purch_id');
    }
}
