<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Services\GoogleAuthService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\Cookie;
use Throwable;

class GoogleAuthController extends Controller
{
    public const FRONT_COOKIE = 'bizflow_oauth_front';

    public function redirect(Request $request, GoogleAuthService $googleAuth): RedirectResponse
    {
        if (! $googleAuth->isConfigured()) {
            return redirect()->away($this->frontendUrl($request).'/login?error=google_not_configured');
        }

        $frontend = $this->frontendUrl($request);
        $callback = $frontend.'/auth/google/callback';

        $response = Socialite::driver('google')
            ->stateless()
            ->scopes(['openid', 'profile', 'email'])
            ->redirectUrl($callback)
            ->redirect();

        $response->headers->setCookie($this->frontCookie($frontend));

        return $response;
    }

    public function callback(Request $request, GoogleAuthService $googleAuth): RedirectResponse
    {
        $frontend = $this->frontendUrl($request);

        if (! $googleAuth->isConfigured()) {
            return redirect()->away($frontend.'/login?error=google_not_configured');
        }

        if ($request->filled('error')) {
            return redirect()->away($frontend.'/login?error=google_denied');
        }

        try {
            $googleUser = Socialite::driver('google')
                ->stateless()
                ->redirectUrl($frontend.'/auth/google/callback')
                ->user();

            $user = $googleAuth->loginOrRegister($googleUser);
        } catch (ValidationException $exception) {
            $message = collect($exception->errors())->flatten()->first() ?: 'google_failed';
            $code = str_contains(strtolower($message), 'inactive') ? 'google_inactive' : 'google_failed';

            return redirect()->away($frontend.'/login?error='.$code);
        } catch (Throwable $exception) {
            Log::error('Google login failed: '.$exception->getMessage());

            return redirect()->away($frontend.'/login?error=google_failed');
        }

        Auth::login($user, true);
        $request->session()->regenerate();

        return redirect()
            ->away($frontend.$googleAuth->destinationPath($user))
            ->withoutCookie(self::FRONT_COOKIE);
    }

    protected function frontendUrl(Request $request): string
    {
        $allowed = [
            rtrim((string) config('app.frontend_url'), '/'),
            'http://localhost:5173',
            'http://127.0.0.1:5173',
        ];
        $allowed = array_values(array_unique(array_filter($allowed)));

        $candidates = [
            (string) $request->cookie(self::FRONT_COOKIE),
            rtrim((string) $request->headers->get('referer'), '/'),
        ];

        foreach ($candidates as $candidate) {
            $origin = $this->originFromUrl($candidate);
            if ($origin && in_array($origin, $allowed, true)) {
                return $origin;
            }
        }

        return $allowed[0] ?? 'http://localhost:5173';
    }

    protected function originFromUrl(string $url): ?string
    {
        if ($url === '') {
            return null;
        }

        $parts = parse_url($url);
        if (empty($parts['scheme']) || empty($parts['host'])) {
            return null;
        }

        $origin = $parts['scheme'].'://'.$parts['host'];
        if (! empty($parts['port'])) {
            $origin .= ':'.$parts['port'];
        }

        return $origin;
    }

    protected function frontCookie(string $frontend): Cookie
    {
        return cookie(self::FRONT_COOKIE, $frontend, 10, '/', null, false, true, false, 'lax');
    }
}
