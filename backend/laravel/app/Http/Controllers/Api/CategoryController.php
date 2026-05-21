<?php

namespace App\Http\Controllers\Api;
 
use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
 
class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::withCount('products');
 
        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }
 
        if ($request->active) {
            $query->where('is_active', true);
        }
 
        return response()->json(['data' => $query->orderBy('name')->get()]);
    }
 
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:categories',
            'description' => 'nullable|string',
            'image' => 'nullable|string',
        ]);
 
        $data['slug'] = Str::slug($data['name']);
        $category = Category::create($data);
        return response()->json(['data' => $category, 'message' => 'Category created'], 201);
    }
 
    public function show(Category $category)
    {
        return response()->json(['data' => $category->load('products')]);
    }
 
    public function update(Request $request, Category $category)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255|unique:categories,name,' . $category->id,
            'description' => 'nullable|string',
            'image' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);
 
        if (isset($data['name'])) {
            $data['slug'] = Str::slug($data['name']);
        }
 
        $category->update($data);
        return response()->json(['data' => $category, 'message' => 'Category updated']);
    }
 
    public function destroy(Category $category)
    {
        if ($category->products()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete category with existing products'
            ], 422);
        }
        $category->delete();
        return response()->json(['message' => 'Category deleted']);
    }
}
 
