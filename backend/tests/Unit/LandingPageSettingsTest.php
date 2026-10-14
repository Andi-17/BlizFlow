<?php

namespace Tests\Unit;

use App\Support\LandingPageSettings;
use Tests\TestCase;

class LandingPageSettingsTest extends TestCase
{
    public function test_normalizes_highlights_and_maps_url(): void
    {
        $normalized = LandingPageSettings::normalize([
            'google_maps_url' => 'https://www.google.com/maps/place/Zurich',
            'highlights_title' => 'Haircuts',
            'highlights' => [
                ['name' => 'Classic cut', 'price' => '25 CHF', 'description' => '30 min'],
                ['name' => '', 'price' => '10'],
            ],
        ], 'barber');

        $this->assertSame('Haircuts', $normalized['highlights_title']);
        $this->assertCount(1, $normalized['highlights']);
        $this->assertSame('Classic cut', $normalized['highlights'][0]['name']);
        $this->assertSame('25 CHF', $normalized['highlights'][0]['price']);
        $this->assertNotNull($normalized['google_maps_url']);
        $this->assertNotNull($normalized['google_maps_embed']);
    }

    public function test_rejects_non_google_maps_urls(): void
    {
        $normalized = LandingPageSettings::normalize([
            'google_maps_url' => 'https://evil.example/maps',
            'google_maps_embed' => 'https://evil.example/embed',
        ], 'general');

        $this->assertNull($normalized['google_maps_url']);
        $this->assertNull($normalized['google_maps_embed']);
    }
}
