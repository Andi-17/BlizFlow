<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AccountDeletionService;
use App\Support\DevTools;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class DevToolsController extends Controller
{
    public function status()
    {
        return $this->success([
            'enabled' => DevTools::enabled(),
            'environment' => app()->environment(),
        ]);
    }

    public function wipeTestUsers(Request $request, AccountDeletionService $deletionService)
    {
        if (! DevTools::enabled()) {
            return $this->error('Test wipe is only available in local / Stripe test mode.', 403);
        }

        $data = $request->validate([
            'confirmation' => ['required', 'string'],
        ]);

        if (strtoupper(trim($data['confirmation'])) !== 'DELETE ALL') {
            throw ValidationException::withMessages([
                'confirmation' => ['Type DELETE ALL to confirm.'],
            ]);
        }

        $actor = Auth::guard('web')->user();
        $actorWasWiped = false;
        $deleted = 0;

        User::query()
            ->where('is_platform_admin', false)
            ->orderBy('id')
            ->chunkById(50, function ($users) use ($deletionService, $actor, &$deleted, &$actorWasWiped) {
                foreach ($users as $user) {
                    if ($actor && (int) $actor->id === (int) $user->id) {
                        $actorWasWiped = true;
                    }
                    $deletionService->deleteAccount($user);
                    $deleted++;
                }
            });

        if ($actorWasWiped) {
            Auth::guard('web')->logout();
            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }
        }

        return $this->success(
            [
                'deleted_users' => $deleted,
                'logged_out' => $actorWasWiped,
            ],
            $deleted === 0
                ? 'No test accounts to wipe'
                : "Wiped {$deleted} test account(s). Platform admins kept."
        );
    }
}
