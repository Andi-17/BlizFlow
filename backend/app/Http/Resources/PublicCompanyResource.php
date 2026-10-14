<?php

namespace App\Http\Resources;

use App\Support\IndustryCatalog;
use App\Support\BusinessPublicUrl;
use App\Support\LandingPageSettings;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class PublicCompanyResource extends JsonResource
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

        $landingPage = LandingPageSettings::normalize(
            $settingsMap['landing_page'] ?? null,
            $industry['slug'],
        );

        $addressParts = array_values(array_filter([
            $this->address_line1,
            $this->address_line2,
            $this->city,
            $this->state,
            $this->postal_code,
            $this->country,
        ]));

        $addressLabel = $addressParts ? implode(', ', $addressParts) : null;

        if (! $landingPage['google_maps_embed'] && $addressLabel) {
            $landingPage['google_maps_embed'] = 'https://www.google.com/maps?q='.rawurlencode($addressLabel).'&output=embed';
        }

        if (! $landingPage['google_maps_url'] && $addressLabel) {
            $landingPage['google_maps_url'] = 'https://www.google.com/maps/search/?api=1&query='.rawurlencode($addressLabel);
        }

        return [
            'name' => $this->name,
            'slug' => $this->slug,
            'tagline' => $this->tagline ?: ($industry['description'] ?? null),
            'logo_url' => $logoUrl,
            'email' => $this->contactEmail(),
            'phone' => $this->phone,
            'address_line1' => $this->address_line1,
            'address_line2' => $this->address_line2,
            'city' => $this->city,
            'state' => $this->state,
            'postal_code' => $this->postal_code,
            'country' => $this->country,
            'address_label' => $addressLabel,
            'opening_hours' => $this->opening_hours,
            'industry' => $industry['slug'],
            'industry_name' => $industry['name'],
            'industry_icon' => $industry['icon'],
            'industry_description' => $industry['description'],
            'services' => array_values($industry['default_categories'] ?? []),
            'landing_page' => $landingPage,
            'public_path' => BusinessPublicUrl::pathForSlug((string) $this->slug),
            'public_url' => BusinessPublicUrl::forSlug((string) $this->slug),
            'has_contact_email' => filled($this->contactEmail()),
        ];
    }
}
