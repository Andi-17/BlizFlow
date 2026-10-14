<?php

namespace App\Http\Resources;

use App\Support\IndustryCatalog;
use App\Support\BusinessPublicUrl;
use App\Support\InvoiceDisplaySettings;
use App\Support\LandingPageSettings;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class CompanyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $industry = IndustryCatalog::get((string) ($this->industry ?: 'general'));
        $logoUrl = null;
        if ($this->logo_path) {
            $logoUrl = Storage::disk('public')->url($this->logo_path);
        }

        $settingsMap = [];
        if ($this->relationLoaded('settings')) {
            foreach ($this->settings as $setting) {
                $settingsMap[$setting->key] = $setting->value;
            }
        }

        $invoiceSettings = InvoiceDisplaySettings::normalize(
            $settingsMap['invoice_settings'] ?? null,
            $industry['slug'],
        );

        $landingPage = LandingPageSettings::normalize(
            $settingsMap['landing_page'] ?? null,
            $industry['slug'],
        );

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'industry' => $industry['slug'],
            'industry_meta' => $industry,
            'tagline' => $this->tagline,
            'logo_path' => $this->logo_path,
            'logo_url' => $logoUrl,
            'email' => $this->email,
            'phone' => $this->phone,
            'address_line1' => $this->address_line1,
            'address_line2' => $this->address_line2,
            'city' => $this->city,
            'state' => $this->state,
            'postal_code' => $this->postal_code,
            'country' => $this->country,
            'opening_hours' => $this->opening_hours,
            'currency' => $this->when($this->relationLoaded('settings'), $settingsMap['currency'] ?? 'EUR'),
            'locale' => $this->when($this->relationLoaded('settings'), $settingsMap['locale'] ?? 'en'),
            'timezone' => $this->when($this->relationLoaded('settings'), $settingsMap['timezone'] ?? null),
            'is_active' => $this->is_active,
            'is_public' => (bool) $this->is_public,
            'subscription' => new SubscriptionResource($this->whenLoaded('subscription')),
            'settings' => $this->whenLoaded('settings'),
            'settings_map' => $this->when($this->relationLoaded('settings'), $settingsMap),
            'invoice_settings' => $this->when($this->relationLoaded('settings'), $invoiceSettings),
            'landing_page' => $this->when($this->relationLoaded('settings'), $landingPage),
            'created_at' => $this->created_at,
            'public_path' => $this->slug ? BusinessPublicUrl::pathForSlug((string) $this->slug) : null,
            'public_url' => $this->slug ? BusinessPublicUrl::forSlug((string) $this->slug) : null,
        ];
    }
}
