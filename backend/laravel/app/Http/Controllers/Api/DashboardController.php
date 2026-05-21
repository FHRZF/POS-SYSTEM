<?php

namespace App\Http\Controllers\Api;
 
use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\Product;
use App\Models\BranchStock;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
 
class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $branchId = $user->branch_id;
 
        $salesQuery = Sale::where('status', 'completed');
        $stockQuery = BranchStock::query();
 
        if ($branchId) {
            $salesQuery->where('branch_id', $branchId);
            $stockQuery->where('branch_id', $branchId);
        }
 
        // Today's sales
        $todaySales = (clone $salesQuery)
            ->whereDate('sale_date', today())
            ->sum('total_amount');
 
        $todayTransactions = (clone $salesQuery)
            ->whereDate('sale_date', today())
            ->count();
 
        // Monthly sales
        $monthlySales = (clone $salesQuery)
            ->whereYear('sale_date', now()->year)
            ->whereMonth('sale_date', now()->month)
            ->sum('total_amount');
 
        // Total products
        $totalProducts = Product::where('is_active', true)->count();
 
        // Total transactions (all time)
        $totalTransactions = (clone $salesQuery)->count();
 
        // Low stock alerts
        $lowStockAlerts = $stockQuery
            ->whereRaw('quantity <= low_stock_threshold')
            ->count();
 
        // Daily sales chart (last 30 days)
        $dailyChart = (clone $salesQuery)
            ->select(
                DB::raw('DATE(sale_date) as date'),
                DB::raw('SUM(total_amount) as total'),
                DB::raw('COUNT(*) as transactions')
            )
            ->where('sale_date', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get();
 
        // Monthly chart (last 12 months)
        $monthlyChart = (clone $salesQuery)
            ->select(
                DB::raw('YEAR(sale_date) as year'),
                DB::raw('MONTH(sale_date) as month'),
                DB::raw('SUM(total_amount) as total'),
                DB::raw('COUNT(*) as transactions')
            )
            ->where('sale_date', '>=', now()->subMonths(12))
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get();
 
        // Top selling products
        $topProducts = DB::table('sales_items')
            ->join('sales', 'sales.id', '=', 'sales_items.sale_id')
            ->join('product_variants', 'product_variants.id', '=', 'sales_items.variant_id')
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->where('sales.status', 'completed')
            ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
            ->where('sales.sale_date', '>=', now()->subDays(30))
            ->select(
                'products.name',
                DB::raw('SUM(sales_items.quantity) as total_qty'),
                DB::raw('SUM(sales_items.subtotal) as total_revenue')
            )
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_qty')
            ->limit(10)
            ->get();
 
        // Branch performance (owner only)
        $branchPerformance = null;
        if ($user->hasRole('owner')) {
            $branchPerformance = Branch::withSum(
                ['sales as today_sales' => fn($q) => $q->whereDate('sale_date', today())
                    ->where('status', 'completed')],
                'total_amount'
            )->withSum(
                ['sales as month_sales' => fn($q) => $q->whereYear('sale_date', now()->year)
                    ->whereMonth('sale_date', now()->month)
                    ->where('status', 'completed')],
                'total_amount'
            )->get();
        }
 
        return response()->json([
            'stats' => [
                'today_sales' => $todaySales,
                'today_transactions' => $todayTransactions,
                'monthly_sales' => $monthlySales,
                'total_products' => $totalProducts,
                'total_transactions' => $totalTransactions,
                'low_stock_alerts' => $lowStockAlerts,
            ],
            'daily_chart' => $dailyChart,
            'monthly_chart' => $monthlyChart,
            'top_products' => $topProducts,
            'branch_performance' => $branchPerformance,
        ]);
    }
}
 