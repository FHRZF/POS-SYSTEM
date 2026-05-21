<?php

namespace Database\Seeders;
 
use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Branch;
use App\Models\Category;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
 
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Roles
        $owner   = Role::firstOrCreate(['name' => 'owner'],   ['display_name' => 'Owner']);
        $admin   = Role::firstOrCreate(['name' => 'admin'],   ['display_name' => 'Admin']);
        $cashier = Role::firstOrCreate(['name' => 'cashier'], ['display_name' => 'Cashier']);
 
        // Branches
        $mainBranch = Branch::firstOrCreate(['code' => 'BR001'], [
            'name' => 'Main Store', 'address' => 'Jl. Raya Utama No. 1',
            'phone' => '081100000001', 'city' => 'Surabaya', 'province' => 'East Java',
        ]);
 
        $northBranch = Branch::firstOrCreate(['code' => 'BR002'], [
            'name' => 'Branch North', 'address' => 'Jl. Utara No. 10',
            'phone' => '081100000002', 'city' => 'Bojonegoro', 'province' => 'East Java',
        ]);
 
        // Categories
        Category::firstOrCreate(['slug' => 'clothing'],    ['name' => 'Clothing',    'description' => 'Apparel']);
        Category::firstOrCreate(['slug' => 'electronics'], ['name' => 'Electronics', 'description' => 'Electronics']);
        Category::firstOrCreate(['slug' => 'food-drink'],  ['name' => 'Food & Drink','description' => 'Food']);
 
        // Owner user
        User::firstOrCreate(['email' => 'owner@pos.com'], [
            'role_id' => $owner->id, 'branch_id' => null,
            'name' => 'Store Owner', 'password' => Hash::make('password123'),
        ]);
 
        // Admin user
        User::firstOrCreate(['email' => 'admin@pos.com'], [
            'role_id' => $admin->id, 'branch_id' => $mainBranch->id,
            'name' => 'Store Admin', 'password' => Hash::make('password123'),
        ]);
 
        // Cashier user
        User::firstOrCreate(['email' => 'cashier@pos.com'], [
            'role_id' => $cashier->id, 'branch_id' => $mainBranch->id,
            'name' => 'Cashier 1', 'password' => Hash::make('password123'),
        ]);
 
        $this->command->info('✅ Seed completed!');
        $this->command->info('Owner:   owner@pos.com / password123');
        $this->command->info('Admin:   admin@pos.com / password123');
        $this->command->info('Cashier: cashier@pos.com / password123');
    }
}
