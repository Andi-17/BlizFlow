<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'name' => fake()->words(3, true),
            'sku' => strtoupper(fake()->unique()->bothify('SKU-####')),
            'description' => fake()->sentence(),
            'price' => fake()->randomFloat(2, 5, 500),
            'cost' => fake()->randomFloat(2, 1, 200),
            'stock_quantity' => fake()->numberBetween(10, 100),
            'min_stock_level' => 5,
            'is_active' => true,
        ];
    }
}
