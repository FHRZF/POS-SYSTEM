<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index()
    {
        return response()->json([
            'message' => 'Supplier list'
        ]);
    }

    public function store(Request $request)
    {
        return response()->json([
            'message' => 'Supplier created'
        ]);
    }

    public function show($id)
    {
        return response()->json([
            'message' => 'Supplier detail',
            'id' => $id
        ]);
    }

    public function update(Request $request, $id)
    {
        return response()->json([
            'message' => 'Supplier updated'
        ]);
    }

    public function destroy($id)
    {
        return response()->json([
            'message' => 'Supplier deleted'
        ]);
    }
}