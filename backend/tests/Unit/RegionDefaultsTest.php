<?php

namespace Tests\Unit;

use App\Support\CurrencyRates;
use App\Support\RegionDefaults;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RegionDefaultsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        CurrencyRates::forgetCache();
    }

    public function test_switzerland_uses_chf_and_german(): void
    {
        $region = RegionDefaults::forCountry('CH');

        $this->assertSame('CHF', $region['currency']);
        $this->assertSame('de', $region['locale']);
        $this->assertSame('Europe/Zurich', $region['timezone']);
    }

    public function test_kosovo_uses_eur_and_albanian(): void
    {
        $region = RegionDefaults::forCountry('XK');

        $this->assertSame('EUR', $region['currency']);
        $this->assertSame('sq', $region['locale']);
    }

    public function test_plan_price_converts_eur_to_chf(): void
    {
        Http::fake([
            'api.frankfurter.app/*' => Http::response([
                'amount' => 1.0,
                'base' => 'EUR',
                'rates' => [
                    'CHF' => 0.94,
                    'USD' => 1.08,
                    'GBP' => 0.86,
                ],
            ], 200),
        ]);

        CurrencyRates::forgetCache();

        $pro = RegionDefaults::planPrice('pro', 'CHF');
        $this->assertSame('CHF', $pro['currency']);
        $this->assertSame(17.86, $pro['amount']); // 19 EUR * 0.94

        $business = RegionDefaults::planPrice('business', 'USD');
        $this->assertSame('USD', $business['currency']);
        $this->assertSame(43.2, $business['amount']); // 40 * 1.08
    }

    public function test_plan_price_eur_unchanged(): void
    {
        $pro = RegionDefaults::planPrice('pro', 'EUR');
        $this->assertSame(19.0, $pro['amount']);
        $this->assertSame('EUR', $pro['currency']);
    }
}
