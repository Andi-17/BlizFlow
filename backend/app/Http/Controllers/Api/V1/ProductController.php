<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Product\StoreProductRequest;
use App\Http\Requests\Api\Product\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('viewAny', Product::class);

        $products = Product::query()
            ->with('category')
            ->when($request->search, fn ($query, $search) => $query->where(function ($inner) use ($search) {
                $inner->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            }))
            ->when($request->boolean('low_stock'), fn ($query) => $query->whereColumn('stock_quantity', '<=', 'min_stock_level'))
            ->when($request->has('is_active'), fn ($query) => $query->where('is_active', $request->boolean('is_active')))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return $this->success(ProductResource::collection($products)->response()->getData(true));
    }

    public function store(StoreProductRequest $request, ActivityLogger $activityLogger)
    {
        Gate::authorize('create', Product::class);

        $product = Product::query()->create($request->validated());
        $activityLogger->log('product.created', $product);

        return $this->created(new ProductResource($product->load('category')));
    }

    public function show(Product $product)
    {
        Gate::authorize('view', $product);

        return $this->success(new ProductResource($product->load('category')));
    }

    public function update(UpdateProductRequest $request, Product $product, ActivityLogger $activityLogger)
    {
        Gate::authorize('update', $product);

        $product->update($request->validated());
        $activityLogger->log('product.updated', $product);

        return $this->success(new ProductResource($product->load('category')), 'Product updated');
    }

    public function destroy(Product $product, ActivityLogger $activityLogger)
    {
        Gate::authorize('delete', $product);

        $product->delete();
        $activityLogger->log('product.deleted', $product);

        return $this->success(null, 'Product deleted');
    }
}
