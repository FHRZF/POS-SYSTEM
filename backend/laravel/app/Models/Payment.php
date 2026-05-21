<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;
 
class Payment extends Model
{
    protected $fillable = [
        'sale_id', 'payment_method', 'amount',
        'change_amount', 'reference_number', 'paid_at',
    ];
 
    protected $casts = [
        'amount' => 'decimal:2',
        'change_amount' => 'decimal:2',
        'paid_at' => 'datetime',
    ];
 
    public function sale() { return $this->belongsTo(Sale::class); }
}
 