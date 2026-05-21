<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\StockController;
use App\Http\Controllers\Api\SupplierController;
 
// ---- Public routes ----
Route::post('/login', [AuthController::class, 'login'])->name('login');
 
// ---- Protected routes ----
Route::middleware('auth:sanctum')->group(function () {
 
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/me/password', [AuthController::class, 'changePassword']);
 
    // Dashboard (all roles)
    Route::get('/dashboard', [DashboardController::class, 'index']);
 
    // Categories
    Route::apiResource('categories', CategoryController::class);
 
    // Products
    Route::apiResource('products', ProductController::class);
    Route::get('/products/search/barcode', [ProductController::class, 'searchBarcode']);
 
    // Variants
    Route::get('/products/{product}/variants', [ProductController::class, 'variants']);
    Route::post('/products/{product}/variants', [ProductController::class, 'addVariant']);
    Route::put('/products/{product}/variants/{variant}', [ProductController::class, 'updateVariant']);
    Route::delete('/products/{product}/variants/{variant}', [ProductController::class, 'deleteVariant']);
 
    // Stock
    Route::get('/stocks', [StockController::class, 'index']);
    Route::put('/stocks/{stock}/adjust', [StockController::class, 'adjust']);
    Route::put('/stocks/{stock}/threshold', [StockController::class, 'updateThreshold']);
 
    // Sales (all roles, filtered by role)
    Route::apiResource('sales', SaleController::class)->except(['update', 'destroy']);
    Route::put('/sales/{sale}/cancel', [SaleController::class, 'cancel']);
 
    // Branches (owner/admin only)
    Route::middleware('role:owner,admin')->group(function () {
        Route::apiResource('branches', BranchController::class);
    });
 
    // Purchases (admin only)
    Route::middleware('role:owner,admin')->group(function () {
        Route::apiResource('purchases', PurchaseController::class)->except(['update', 'destroy']);
    });
 
    // Suppliers
    Route::middleware('role:owner,admin')->group(function () {
        Route::apiResource('suppliers', SupplierController::class);
    });
 
    // Users (admin/owner only)
    Route::middleware('role:owner,admin')->group(function () {
        Route::apiResource('users', UserController::class);
    });
 
    // Reports
    Route::prefix('reports')->group(function () {
        Route::get('/sales', [ReportController::class, 'sales']);
        Route::get('/stock', [ReportController::class, 'stockReport']);
    });
});
 