<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;
 
class BranchStock extends Model
{
    protected $fillable = ['branch_id', 'variant_id', 'quantity', 'low_stock_threshold'];
 
    public function branch() {
        return $this->belongsTo(Branch::class);
    }
 
    public function variant() {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }
 
    public function isLowStock(): bool {
        return $this->quantity <= $this->low_stock_threshold;
    }
 
    public function decreaseStock(int $qty): void {
        $this->decrement('quantity', $qty);
    }
 
    public function increaseStock(int $qty): void {
        $this->increment('quantity', $qty);
    }
}
 