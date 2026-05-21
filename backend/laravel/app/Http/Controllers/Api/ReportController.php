<?php

namespace App\Http\Controllers\Api;
 
use App\Http\Controllers\Controller;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
 
class ReportController extends Controller
{
    public function sales(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'branch_id' => 'nullable|exists:branches,id',
        ]);
 
        $query = Sale::with('items.variant.product', 'payment', 'user', 'branch')
            ->where('status', 'completed')
            ->whereBetween('sale_date', [$request->start_date, $request->end_date . ' 23:59:59']);
 
        $user = $request->user();
        if ($user->hasRole('admin') && $user->branch_id) {
            $query->where('branch_id', $user->branch_id);
        } elseif ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }
 
        $sales = $query->orderBy('sale_date')->get();
 
        $summary = [
            'total_transactions' => $sales->count(),
            'total_revenue' => $sales->sum('total_amount'),
            'total_discount' => $sales->sum('discount_amount'),
            'average_transaction' => $sales->count() > 0
                ? $sales->sum('total_amount') / $sales->count()
                : 0,
            'by_payment_method' => $sales->groupBy(fn($s) => $s->payment?->payment_method)
                ->map(fn($group) => [
                    'count' => $group->count(),
                    'total' => $group->sum('total_amount'),
                ]),
        ];
 
        return response()->json([
            'sales' => $sales,
            'summary' => $summary,
        ]);
    }
 
    public function stockReport(Request $request)
    {
        $query = DB::table('branch_stocks')
            ->join('product_variants', 'product_variants.id', '=', 'branch_stocks.variant_id')
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->join('categories', 'categories.id', '=', 'products.category_id')
            ->join('branches', 'branches.id', '=', 'branch_stocks.branch_id')
            ->select(
                'branches.name as branch_name',
                'categories.name as category_name',
                'products.name as product_name',
                'product_variants.variant_name',
                'product_variants.sku',
                'product_variants.barcode',
                'branch_stocks.quantity',
                'branch_stocks.low_stock_threshold',
                DB::raw('IF(branch_stocks.quantity <= branch_stocks.low_stock_threshold, 1, 0) as is_low_stock')
            );
 
        $user = $request->user();
        if ($user->hasRole('admin') && $user->branch_id) {
            $query->where('branch_stocks.branch_id', $user->branch_id);
        } elseif ($request->branch_id) {
            $query->where('branch_stocks.branch_id', $request->branch_id);
        }
 
        if ($request->low_stock_only) {
            $query->whereRaw('branch_stocks.quantity <= branch_stocks.low_stock_threshold');
        }
 
        return response()->json(['data' => $query->orderBy('branches.name')->orderBy('products.name')->get()]);
    }
}
