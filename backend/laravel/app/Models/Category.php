<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
 
class Category extends Model
{
    protected $fillable = ['name', 'slug', 'description', 'image', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];
 
    protected static function boot() {
        parent::boot();
        static::creating(function ($model) {
            if (!$model->slug) {
                $model->slug = Str::slug($model->name);
            }
        });
    }
 
    public function products() {
        return $this->hasMany(Product::class);
    }
}
