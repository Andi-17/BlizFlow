<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PlanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $currency = $this->display_currency ?? $this->currency;
        $price = $this->display_price ?? $this->price;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'family' => $this->family(),
            'description' => $this->description,
            'interval' => $this->interval,
            'price' => $price,
            'currency' => $currency,
            'features' => $this->highlightItems(),
            'limits' => $this->limits(),
            'is_free' => $this->isFree(),
            'is_featured' => $this->isFeatured(),
            'is_active' => $this->is_active,
            'is_public' => $this->isPublic(),
            'is_free_ultra' => $this->isFreeUltra(),
            'trial_days' => $this->trial_days,
            'sort_order' => $this->sort_order,
            'stripe_price_id' => $this->when(request()->is('api/v1/admin/*'), $this->stripe_price_id),
            'stripe_product_id' => $this->when(request()->is('api/v1/admin/*'), $this->stripe_product_id),
        ];
    }
}
