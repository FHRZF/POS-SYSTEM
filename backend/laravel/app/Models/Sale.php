<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;
 
class Sale extends Model
{
    protected $fillable = [
        'branch_id', 'user_id', 'sale_number', 'sale_date',
        'subtotal', 'discount_amount', 'tax_amount', 'total_amount',
        'status', 'notes',
    ];
 
    protected $casts = [
        'sale_date' => 'datetime',
        'subtotal' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];
 
    public function branch() { return $this->belongsTo(Branch::class); }
    public function user() { return $this->belongsTo(User::class); }
    public function items() { return $this->hasMany(SaleItem::class); }
    public function payment() { return $this->hasOne(Payment::class); }
 
    public static function generateNumber(): string {
        $prefix = 'TRX';
        $date = now()->format('Ymd');
        $last = static::whereDate('created_at', today())->count();
        return $prefix . $date . str_pad($last + 1, 4, '0', STR_PAD_LEFT);
    }
}
 
