<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;
 
class Branch extends Model
{
    protected $fillable = [
        'name', 'code', 'address', 'phone',
        'email', 'city', 'province', 'is_active',
    ];
 
    protected $casts = ['is_active' => 'boolean'];
 
    public function users() {
        return $this->hasMany(User::class);
    }
 
    public function stocks() {
        return $this->hasMany(BranchStock::class);
    }
 
    public function sales() {
        return $this->hasMany(Sale::class);
    }
 
    public function purchases() {
        return $this->hasMany(Purchase::class);
    }
}
 
