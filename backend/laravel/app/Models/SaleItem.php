<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;
 
class SaleItem extends Model
{
    protected $table = 'sales_items';
    protected $fillable = ['sale_id', 'variant_id', 'quantity', 'unit_price', 'discount', 'subtotal'];
 
    protected $casts = [
        'unit_price' => 'decimal:2',
        'discount' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];
 
    public function sale() { return $this->belongsTo(Sale::class); }
    public function variant() { return $this->belongsTo(ProductVariant::class, 'variant_id'); }
}
 