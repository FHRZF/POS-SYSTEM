<?php

namespace App\Http\Controllers\Api;
 
use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\Request;
 
class BranchController extends Controller
{
    public function index()
    {
        $branches = Branch::withCount(['sales', 'users'])->get();
        return response()->json(['data' => $branches]);
    }
 
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:20|unique:branches',
            'address' => 'required|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'city' => 'nullable|string',
            'province' => 'nullable|string',
        ]);
 
        $branch = Branch::create($data);
        return response()->json(['data' => $branch, 'message' => 'Branch created'], 201);
    }
 
    public function show(Branch $branch)
    {
        return response()->json([
            'data' => $branch->load('users', 'stocks.variant.product')
        ]);
    }
 
    public function update(Request $request, Branch $branch)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'code' => 'sometimes|string|max:20|unique:branches,code,' . $branch->id,
            'address' => 'sometimes|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'city' => 'nullable|string',
            'province' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);
 
        $branch->update($data);
        return response()->json(['data' => $branch, 'message' => 'Branch updated']);
    }
 
    public function destroy(Branch $branch)
    {
        $branch->update(['is_active' => false]);
        return response()->json(['message' => 'Branch deactivated']);
    }
}
 