<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('viewAny', Product::class);

        $products = Product::query()
            ->with('category')
            ->when($request->boolean('low_stock_only'), fn ($query) => $query->whereColumn('stock_quantity', '<=', 'min_stock_level'))
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->string('search')->toString();
                $query->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate($request->integer('per_page', 50));

        return $this->success([
            'summary' => [
                'total_skus' => Product::query()->count(),
                'low_stock_count' => Product::query()->whereColumn('stock_quantity', '<=', 'min_stock_level')->count(),
                'out_of_stock_count' => Product::query()->where('stock_quantity', '<=', 0)->count(),
            ],
            'products' => ProductResource::collection($products)->response()->getData(true),
        ]);
    }

    public function adjust(Request $request, Product $product)
    {
        Gate::authorize('update', $product);

        $data = $request->validate([
            'stock_quantity' => ['required', 'integer', 'min:0'],
            'min_stock_level' => ['nullable', 'integer', 'min:0'],
        ]);

        $product->update($data);

        return $this->success(new ProductResource($product->fresh('category')), 'Inventory updated');
    }
}
