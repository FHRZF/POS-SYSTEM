<?php

namespace App\Http\Controllers\Api;
 
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\BranchStock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
 
class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with('category', 'variants');
 
        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }
 
        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        }
 
        if ($request->active) {
            $query->where('is_active', true);
        }
 
        $products = $query->orderBy('name')
            ->paginate($request->per_page ?? 20);
 
        return response()->json($products);
    }
 
    public function store(Request $request)
    {
        $data = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string',
            'description' => 'nullable|string',
            'base_price' => 'required|numeric|min:0',
            'base_cost' => 'required|numeric|min:0',
            'has_variants' => 'boolean',
            'variants' => 'nullable|array',
            'variants.*.name' => 'required_with:variants|string',
            'variants.*.sku' => 'nullable|string|unique:product_variants,sku',
            'variants.*.barcode' => 'nullable|string|unique:product_variants,barcode',
            'variants.*.price' => 'required_with:variants|numeric|min:0',
            'variants.*.cost' => 'required_with:variants|numeric|min:0',
        ]);

        // Auto-generate slug if not provided
        if (empty($data['slug'])) {
            $data['slug'] = \Str::slug($data['name']);
        }

        DB::beginTransaction();
        try {
            $product = Product::create($data);

            if (!empty($data['variants'])) {
                foreach ($data['variants'] as $variantData) {
                    $product->variants()->create($variantData);
                }
            } else {
                // Auto-create single variant for simple products
                $product->variants()->create([
                    'name' => $product->name,
                    'price' => $product->base_price,
                    'cost' => $product->base_cost,
                ]);
            }

            DB::commit();
            return response()->json([
                'data' => $product->load('variants', 'category'),
                'message' => 'Product created'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    
 
    public function show(Product $product)
    {
        return response()->json([
            'data' => $product->load('category', 'variants.branchStocks.branch', 'variantAttributes')
        ]);
    }
 
    public function update(Request $request, Product $product)
    {
        $data = $request->validate([
            'category_id' => 'sometimes|exists:categories,id',
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'base_price' => 'sometimes|numeric|min:0',
            'base_cost' => 'sometimes|numeric|min:0',
            'is_active' => 'sometimes|boolean',
        ]);
 
        $product->update($data);
        return response()->json([
            'data' => $product->load('category', 'variants'),
            'message' => 'Product updated'
        ]);
    }
 
    public function destroy(Product $product)
    {
        $product->update(['is_active' => false]);
        return response()->json(['message' => 'Product deactivated']);
    }
 
    public function searchBarcode(Request $request)
    {
        $request->validate(['barcode' => 'required|string']);
 
        $variant = ProductVariant::with('product.category')
            ->where('barcode', $request->barcode)
            ->where('is_active', true)
            ->first();
 
        if (!$variant) {
            return response()->json(['message' => 'Product not found'], 404);
        }
 
        // Get stock for the requested branch
        $branchId = $request->branch_id ?? $request->user()->branch_id;
        $stock = BranchStock::where('branch_id', $branchId)
            ->where('variant_id', $variant->id)
            ->first();
 
        return response()->json([
            'data' => [
                'variant' => $variant,
                'stock' => $stock ? $stock->quantity : 0,
            ]
        ]);
    }
}
 
