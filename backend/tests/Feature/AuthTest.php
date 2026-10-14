<?php

namespace Tests\Feature;

use App\Mail\AccountVerificationCodeMail;
use App\Mail\LoginVerificationCodeMail;
use App\Mail\LoginWelcomeMail;
use App\Mail\WelcomeMail;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AuthTest extends TestCase
{
    public function test_user_can_register_with_company(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Jane Doe',
            'username' => 'janedoe',
            'email' => 'jane@example.com',
            'password' => 'Password1',
            'password_confirmation' => 'Password1',
            'company_name' => 'Jane Corp',
            'country' => 'AL',
            'plan' => 'free',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.email', 'jane@example.com');

        Mail::assertSent(AccountVerificationCodeMail::class);

        $cacheKey = 'bizflow:register:'.hash('sha256', 'jane@example.com');
        $payload = Cache::get($cacheKey);
        $this->assertIsArray($payload);
        $this->assertNotEmpty($payload['code_hash']);

        $code = '123456';
        $payload['code_hash'] = hash('sha256', $code);
        Cache::put($cacheKey, $payload, now()->addMinutes(15));

        $confirm = $this->postJson('/api/v1/auth/register/confirm', [
            'email' => 'jane@example.com',
            'verification_code' => $code,
        ]);

        $confirm->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.email', 'jane@example.com')
            ->assertJsonPath('data.user.username', 'janedoe')
            ->assertJsonPath('data.company.name', 'Jane Corp');

        Mail::assertSent(WelcomeMail::class);
        $this->assertDatabaseHas('users', ['email' => 'jane@example.com', 'username' => 'janedoe']);
        $this->assertDatabaseHas('companies', ['name' => 'Jane Corp', 'country' => 'AL']);
        $this->assertDatabaseHas('company_settings', [
            'key' => 'currency',
            'value' => 'EUR',
        ]);
        $this->assertDatabaseHas('company_settings', [
            'key' => 'locale',
            'value' => 'sq',
        ]);
        $confirm->assertJsonPath('data.locale', 'sq');
        $confirm->assertJsonPath('data.currency', 'EUR');
    }

    public function test_swiss_registration_defaults_to_chf_and_german(): void
    {
        Mail::fake();

        $this->postJson('/api/v1/auth/register', [
            'name' => 'Swiss Owner',
            'username' => 'swissowner',
            'email' => 'swiss@example.com',
            'password' => 'Password1',
            'password_confirmation' => 'Password1',
            'company_name' => 'Alpine GmbH',
            'country' => 'CH',
        ])->assertOk();

        $cacheKey = 'bizflow:register:'.hash('sha256', 'swiss@example.com');
        $payload = Cache::get($cacheKey);
        $payload['code_hash'] = hash('sha256', '123456');
        Cache::put($cacheKey, $payload, now()->addMinutes(15));

        $confirm = $this->postJson('/api/v1/auth/register/confirm', [
            'email' => 'swiss@example.com',
            'verification_code' => '123456',
        ]);

        $confirm->assertCreated()
            ->assertJsonPath('data.locale', 'de')
            ->assertJsonPath('data.currency', 'CHF')
            ->assertJsonPath('data.company.country', 'CH');

        $this->assertDatabaseHas('company_settings', [
            'key' => 'currency',
            'value' => 'CHF',
        ]);
        $this->assertDatabaseHas('company_settings', [
            'key' => 'locale',
            'value' => 'de',
        ]);
    }

    public function test_user_can_login(): void
    {
        Mail::fake();

        $user = User::factory()->create([
            'email' => 'login@example.com',
            'username' => 'loginuser',
            'password' => 'password',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'login' => 'loginuser',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.requires_verification', true)
            ->assertJsonPath('data.user_id', $user->id);

        Mail::assertSent(LoginVerificationCodeMail::class);

        $cacheKey = 'bizflow:login:'.$user->id;
        $payload = Cache::get($cacheKey);
        $payload['code_hash'] = hash('sha256', '654321');
        Cache::put($cacheKey, $payload, now()->addMinutes(10));

        $confirm = $this->postJson('/api/v1/auth/login/confirm', [
            'user_id' => $user->id,
            'verification_code' => '654321',
        ]);

        $confirm->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.email', 'login@example.com');

        Mail::assertSent(LoginWelcomeMail::class);
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'login@example.com',
            'username' => 'loginuser',
            'password' => 'password',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'login' => 'login@example.com',
            'password' => 'wrong-password',
        ])->assertStatus(422);
    }
}
