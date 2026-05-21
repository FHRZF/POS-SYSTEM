<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;
 
class Purchase extends Model
{
    protected $fillable = [
        'branch_id', 'supplier_id', 'user_id', 'purchase_number',
        'purchase_date', 'status', 'total_amount', 'notes',
    ];
 
    protected $casts = [
        'purchase_date' => 'date',
        'total_amount' => 'decimal:2',
    ];
 
    public function branch() { return $this->belongsTo(Branch::class); }
    public function supplier() { return $this->belongsTo(Supplier::class); }
    public function user() { return $this->belongsTo(User::class); }
    public function items() { return $this->hasMany(PurchaseItem::class); }
 
    public static function generateNumber(): string {
        $prefix = 'PO';
        $date = now()->format('Ymd');
        $last = static::whereDate('created_at', today())->count();
        return $prefix . $date . str_pad($last + 1, 4, '0', STR_PAD_LEFT);
    }
}
 