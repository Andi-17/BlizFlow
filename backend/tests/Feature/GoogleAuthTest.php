<?php

namespace Tests\Feature;

use App\Mail\WelcomeMail;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Laravel\Socialite\Contracts\User as SocialUser;
use Laravel\Socialite\Facades\Socialite;
use Mockery;
use Tests\TestCase;

class GoogleAuthTest extends TestCase
{
    protected function mockGoogleUser(array $attrs = []): void
    {
        $social = Mockery::mock(SocialUser::class);
        $social->shouldReceive('getId')->andReturn($attrs['id'] ?? 'google-123');
        $social->shouldReceive('getEmail')->andReturn($attrs['email'] ?? 'google.user@example.com');
        $social->shouldReceive('getName')->andReturn($attrs['name'] ?? 'Google User');
        $social->shouldReceive('getAvatar')->andReturn($attrs['avatar'] ?? 'https://example.com/a.png');

        $provider = Mockery::mock();
        $provider->shouldReceive('stateless')->andReturnSelf();
        $provider->shouldReceive('scopes')->andReturnSelf();
        $provider->shouldReceive('redirectUrl')->andReturnSelf();
        $provider->shouldReceive('redirect')->andReturn(redirect('https://accounts.google.com/o/oauth2/auth'));
        $provider->shouldReceive('user')->andReturn($social);

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);
    }

    public function test_providers_lists_google_when_configured(): void
    {
        config([
            'services.google.client_id' => 'gid',
            'services.google.client_secret' => 'gsecret',
        ]);

        $this->getJson('/api/v1/auth/providers')
            ->assertOk()
            ->assertJsonPath('data.google', true);
    }

    public function test_google_redirect_without_credentials_returns_to_login(): void
    {
        config([
            'services.google.client_id' => null,
            'services.google.client_secret' => null,
        ]);

        $this->get('/auth/google/redirect')
            ->assertRedirect()
            ->assertLocation('http://localhost:5173/login?error=google_not_configured');
    }

    public function test_google_callback_creates_and_logs_in_user(): void
    {
        Mail::fake();
        config([
            'services.google.client_id' => 'gid',
            'services.google.client_secret' => 'gsecret',
            'app.frontend_url' => 'http://localhost:5173',
        ]);
        $this->mockGoogleUser();

        $this->withUnencryptedCookie('bizflow_oauth_front', 'http://localhost:5173')
            ->get('/auth/google/callback?code=fake')
            ->assertRedirect('http://localhost:5173/onboarding/company');

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'google.user@example.com',
            'google_id' => 'google-123',
        ]);
        Mail::assertSent(WelcomeMail::class);
    }

    public function test_google_callback_logs_in_existing_email_without_new_user(): void
    {
        Mail::fake();
        config([
            'services.google.client_id' => 'gid',
            'services.google.client_secret' => 'gsecret',
            'app.frontend_url' => 'http://localhost:5173',
        ]);

        $user = User::factory()->create([
            'email' => 'google.user@example.com',
            'username' => 'existinggoogle',
        ]);

        $this->mockGoogleUser();

        $this->withUnencryptedCookie('bizflow_oauth_front', 'http://localhost:5173')
            ->get('/auth/google/callback?code=fake')
            ->assertRedirect('http://localhost:5173/onboarding/company');

        $this->assertAuthenticatedAs($user->fresh());
        $this->assertEquals(1, User::query()->where('email', 'google.user@example.com')->count());
        $this->assertSame('google-123', $user->fresh()->google_id);
        Mail::assertNotSent(WelcomeMail::class);
    }
}
