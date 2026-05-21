<?php

namespace App\Http\Controllers\Api;
 
use App\Http\Controllers\Controller;
use App\Models\BranchStock;
use Illuminate\Http\Request;
 
class StockController extends Controller
{
    public function index(Request $request)
    {
        $query = BranchStock::with('variant.product.category', 'branch');
 
        $user = $request->user();
        if ($user->hasRole('admin') && $user->branch_id) {
            $query->where('branch_id', $user->branch_id);
        } elseif ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }
 
        if ($request->low_stock) {
            $query->whereRaw('quantity <= low_stock_threshold');
        }
 
        return response()->json(['data' => $query->get()]);
    }
 
    public function adjust(Request $request, BranchStock $stock)
    {
        $request->validate([
            'quantity' => 'required|integer',
            'type' => 'required|in:set,add,subtract',
            'reason' => 'required|string',
        ]);
 
        match ($request->type) {
            'set'      => $stock->update(['quantity' => $request->quantity]),
            'add'      => $stock->increment('quantity', $request->quantity),
            'subtract' => $stock->decrement('quantity', $request->quantity),
        };
 
        return response()->json(['data' => $stock->fresh(), 'message' => 'Stock adjusted']);
    }
 
    public function updateThreshold(Request $request, BranchStock $stock)
    {
        $request->validate(['low_stock_threshold' => 'required|integer|min:0']);
        $stock->update(['low_stock_threshold' => $request->low_stock_threshold]);
        return response()->json(['data' => $stock, 'message' => 'Threshold updated']);
    }
}
