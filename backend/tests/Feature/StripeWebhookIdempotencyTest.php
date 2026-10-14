<?php

namespace Tests\Feature;

use App\Models\StripeWebhookEvent;
use App\Services\Billing\StripeService;
use Stripe\Exception\SignatureVerificationException;
use Stripe\WebhookSignature;
use Tests\TestCase;

class StripeWebhookIdempotencyTest extends TestCase
{
    public function test_duplicate_webhook_events_are_idempotent(): void
    {
        $secret = 'whsec_test_bizflow_local_secret';
        config(['services.stripe.webhook_secret' => $secret]);

        $payload = json_encode([
            'id' => 'evt_test_123',
            'object' => 'event',
            'type' => 'ping',
            'data' => [
                'object' => [],
            ],
        ], JSON_THROW_ON_ERROR);

        $signature = WebhookSignature::generateSignatureHeader($payload, $secret);
        $service = app(StripeService::class);

        $first = $service->handleWebhook($payload, $signature);
        $this->assertSame('processed', $first['status']);

        $this->assertDatabaseHas('stripe_webhook_events', [
            'stripe_event_id' => 'evt_test_123',
        ]);

        $this->assertNotNull(
            StripeWebhookEvent::query()->where('stripe_event_id', 'evt_test_123')->value('processed_at')
        );

        $second = $service->handleWebhook($payload, $signature);

        $this->assertSame('duplicate', $second['status']);
        $this->assertSame(1, StripeWebhookEvent::query()->where('stripe_event_id', 'evt_test_123')->count());
    }

    public function test_invalid_webhook_signature_is_rejected(): void
    {
        config(['services.stripe.webhook_secret' => 'whsec_test_bizflow_local_secret']);

        $payload = json_encode([
            'id' => 'evt_bad_sig',
            'object' => 'event',
            'type' => 'ping',
            'data' => ['object' => []],
        ], JSON_THROW_ON_ERROR);

        $this->expectException(SignatureVerificationException::class);

        app(StripeService::class)->handleWebhook($payload, 't='.time().',v1=deadbeef');
    }
}
