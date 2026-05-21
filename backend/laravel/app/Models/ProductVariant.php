<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;
 
class ProductVariant extends Model
{
    protected $fillable = [
        'product_id', 'name', 'sku', 'barcode',
        'price', 'cost', 'image', 'is_active',
    ];
 
    protected $casts = [
        'price' => 'decimal:2',
        'cost' => 'decimal:2',
        'is_active' => 'boolean',
    ];
 
    public function product() {
        return $this->belongsTo(Product::class);
    }
 
    public function attributeValues() {
        return $this->hasMany(ProductVariantAttributeValue::class, 'variant_id');
    }
 
    public function branchStocks() {
        return $this->hasMany(BranchStock::class, 'variant_id');
    }
 
    public function stockInBranch(int $branchId) {
        return $this->branchStocks()->where('branch_id', $branchId)->first();
    }
}
 