<?php

namespace App\Http\Controllers\Api;
 
use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Payment;
use App\Models\BranchStock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
 
class SaleController extends Controller
{
    public function index(Request $request)
    {
        $query = Sale::with('user', 'branch', 'payment')
            ->withCount('items');
 
        // Cashiers only see their own sales
        $user = $request->user();
        if ($user->hasRole('cashier')) {
            $query->where('user_id', $user->id);
        }
 
        // Admin only sees their branch
        if ($user->hasRole('admin') && $user->branch_id) {
            $query->where('branch_id', $user->branch_id);
        }
 
        if ($request->branch_id && $user->hasAnyRole(['owner'])) {
            $query->where('branch_id', $request->branch_id);
        }
 
        if ($request->start_date) {
            $query->whereDate('sale_date', '>=', $request->start_date);
        }
 
        if ($request->end_date) {
            $query->whereDate('sale_date', '<=', $request->end_date);
        }
 
        if ($request->status) {
            $query->where('status', $request->status);
        }
 
        $sales = $query->orderByDesc('sale_date')
            ->paginate($request->per_page ?? 20);
 
        return response()->json($sales);
    }
 
    public function store(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'items' => 'required|array|min:1',
            'items.*.variant_id' => 'required|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
            'payment_method' => 'required|in:cash,qris,bank_transfer',
            'payment_amount' => 'required|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
        ]);
 
        DB::beginTransaction();
        try {
            $subtotal = 0;
            $items = [];
 
            foreach ($request->items as $item) {
                $qty = $item['quantity'];
                $price = $item['unit_price'];
                $discount = $item['discount'] ?? 0;
                $itemSubtotal = ($price * $qty) - $discount;
                $subtotal += $itemSubtotal;
 
                // Check stock
                $stock = BranchStock::where('branch_id', $request->branch_id)
                    ->where('variant_id', $item['variant_id'])
                    ->lockForUpdate()
                    ->first();
 
                if (!$stock || $stock->quantity < $qty) {
                    throw new \Exception("Insufficient stock for variant ID: {$item['variant_id']}");
                }
 
                $items[] = [
                    'variant_id' => $item['variant_id'],
                    'quantity' => $qty,
                    'unit_price' => $price,
                    'discount' => $discount,
                    'subtotal' => $itemSubtotal,
                ];
            }
 
            $discountAmount = $request->discount_amount ?? 0;
            $taxAmount = $request->tax_amount ?? 0;
            $totalAmount = $subtotal - $discountAmount + $taxAmount;
            $changeAmount = max(0, $request->payment_amount - $totalAmount);
 
            if ($request->payment_amount < $totalAmount) {
                throw new \Exception("Payment amount is insufficient");
            }
 
            // Create sale
            $sale = Sale::create([
                'branch_id' => $request->branch_id,
                'user_id' => $request->user()->id,
                'sale_number' => Sale::generateNumber(),
                'sale_date' => now(),
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
                'status' => 'completed',
            ]);
 
            // Create items and deduct stock
            foreach ($items as $item) {
                $sale->items()->create($item);
 
                BranchStock::where('branch_id', $request->branch_id)
                    ->where('variant_id', $item['variant_id'])
                    ->decrement('quantity', $item['quantity']);
            }
 
            // Create payment
            $sale->payment()->create([
                'payment_method' => $request->payment_method,
                'amount' => $request->payment_amount,
                'change_amount' => $changeAmount,
                'paid_at' => now(),
            ]);
 
            DB::commit();
 
            return response()->json([
                'data' => $sale->load('items.variant.product', 'payment', 'user', 'branch'),
                'message' => 'Sale completed successfully',
                'change' => $changeAmount,
            ], 201);
 
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
 
    public function show(Sale $sale)
    {
        return response()->json([
            'data' => $sale->load('items.variant.product', 'payment', 'user', 'branch')
        ]);
    }
 
    public function cancel(Sale $sale)
    {
        if ($sale->status !== 'completed') {
            return response()->json(['message' => 'Sale cannot be cancelled'], 422);
        }
 
        DB::beginTransaction();
        try {
            // Restore stock
            foreach ($sale->items as $item) {
                BranchStock::where('branch_id', $sale->branch_id)
                    ->where('variant_id', $item->variant_id)
                    ->increment('quantity', $item->quantity);
            }
 
            $sale->update(['status' => 'cancelled']);
            DB::commit();
 
            return response()->json(['message' => 'Sale cancelled and stock restored']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}
 