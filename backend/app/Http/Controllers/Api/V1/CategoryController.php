<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Category\StoreCategoryRequest;
use App\Http\Requests\Api\Category\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('viewAny', Category::class);

        $categories = Category::query()->latest()->paginate($request->integer('per_page', 50));

        return $this->success(CategoryResource::collection($categories)->response()->getData(true));
    }

    public function store(StoreCategoryRequest $request)
    {
        Gate::authorize('create', Category::class);

        $data = $request->validated();
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);

        $category = Category::query()->create($data);

        return $this->created(new CategoryResource($category));
    }

    public function show(Category $category)
    {
        Gate::authorize('view', $category);

        return $this->success(new CategoryResource($category));
    }

    public function update(UpdateCategoryRequest $request, Category $category)
    {
        Gate::authorize('update', $category);

        $category->update($request->validated());

        return $this->success(new CategoryResource($category), 'Category updated');
    }

    public function destroy(Category $category)
    {
        Gate::authorize('delete', $category);

        $category->delete();

        return $this->success(null, 'Category deleted');
    }
}
