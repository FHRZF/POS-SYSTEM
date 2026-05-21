<?php

namespace App\Http\Controllers\Api;
 
use App\Http\Controllers\Controller;
use App\Models\Purchase;
use App\Models\BranchStock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
 
class PurchaseController extends Controller
{
    public function index(Request $request)
    {
        $query = Purchase::with('branch', 'supplier', 'user')->withCount('items');
 
        $user = $request->user();
        if ($user->hasRole('admin') && $user->branch_id) {
            $query->where('branch_id', $user->branch_id);
        }
 
        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }
 
        if ($request->start_date) {
            $query->whereDate('purchase_date', '>=', $request->start_date);
        }
 
        if ($request->end_date) {
            $query->whereDate('purchase_date', '<=', $request->end_date);
        }
 
        return response()->json($query->orderByDesc('purchase_date')->paginate(20));
    }
 
    public function store(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'purchase_date' => 'required|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.variant_id' => 'required|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);
 
        DB::beginTransaction();
        try {
            $totalAmount = 0;
            $itemsData = [];
 
            foreach ($request->items as $item) {
                $subtotal = $item['quantity'] * $item['unit_cost'];
                $totalAmount += $subtotal;
                $itemsData[] = [
                    'variant_id' => $item['variant_id'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'],
                    'subtotal' => $subtotal,
                ];
            }
 
            $purchase = Purchase::create([
                'branch_id' => $request->branch_id,
                'supplier_id' => $request->supplier_id,
                'user_id' => $request->user()->id,
                'purchase_number' => Purchase::generateNumber(),
                'purchase_date' => $request->purchase_date,
                'status' => 'received',
                'total_amount' => $totalAmount,
                'notes' => $request->notes,
            ]);
 
            foreach ($itemsData as $item) {
                $purchase->items()->create($item);
 
                // Increase branch stock
                BranchStock::updateOrCreate(
                    ['branch_id' => $request->branch_id, 'variant_id' => $item['variant_id']],
                    ['quantity' => DB::raw("quantity + {$item['quantity']}")]
                );
            }
 
            DB::commit();
            return response()->json([
                'data' => $purchase->load('items.variant.product', 'supplier'),
                'message' => 'Purchase recorded and stock updated'
            ], 201);
 
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
 
    public function show(Purchase $purchase)
    {
        return response()->json([
            'data' => $purchase->load('items.variant.product', 'supplier', 'branch', 'user')
        ]);
    }
}
