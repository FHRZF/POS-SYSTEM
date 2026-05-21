<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;
 
class PurchaseItem extends Model
{
    protected $fillable = ['purchase_id', 'variant_id', 'quantity', 'unit_cost', 'subtotal'];
 
    protected $casts = [
        'unit_cost' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];
 
    public function purchase() { return $this->belongsTo(Purchase::class); }
    public function variant() { return $this->belongsTo(ProductVariant::class, 'variant_id'); }
}
 