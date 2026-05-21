<?php

namespace App\Models;
 
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
 
class User extends Authenticatable
{
    use HasApiTokens, Notifiable;
 
    protected $fillable = [
        'role_id', 'branch_id', 'name', 'email',
        'password', 'phone', 'avatar', 'is_active',
    ];
 
    protected $hidden = ['password', 'remember_token'];
 
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
    ];
 
    public function role() {
        return $this->belongsTo(Role::class);
    }
 
    public function branch() {
        return $this->belongsTo(Branch::class);
    }
 
    public function sales() {
        return $this->hasMany(Sale::class);
    }
 
    public function purchases() {
        return $this->hasMany(Purchase::class);
    }
 
    public function hasRole(string $role): bool {
        return $this->role && $this->role->name === $role;
    }
 
    public function hasAnyRole(array $roles): bool {
        return $this->role && in_array($this->role->name, $roles);
    }
}