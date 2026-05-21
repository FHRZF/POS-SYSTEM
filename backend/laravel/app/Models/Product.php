<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
 
class Product extends Model
{
    protected $fillable = [
        'category_id', 'name', 'slug', 'description',
        'image', 'base_price', 'base_cost', 'has_variants', 'is_active',
    ];
 
    protected $casts = [
        'base_price' => 'decimal:2',
        'base_cost' => 'decimal:2',
        'has_variants' => 'boolean',
        'is_active' => 'boolean',
    ];
 
    protected static function boot() {
        parent::boot();
        static::creating(function ($model) {
            if (!$model->slug) {
                $model->slug = Str::slug($model->name);
            }
        });
    }
 
    public function category() {
        return $this->belongsTo(Category::class);
    }
 
    public function variants() {
        return $this->hasMany(ProductVariant::class);
    }
 
    public function variantAttributes() {
        return $this->hasMany(ProductVariantAttribute::class);
    }
}
