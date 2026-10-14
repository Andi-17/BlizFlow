<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Request;

class ActivityLogger
{
    public function log(
        string $action,
        ?Model $subject = null,
        array $properties = [],
        ?User $user = null,
        ?int $companyId = null,
    ): ActivityLog {
        $user = $user ?? auth()->user();
        $companyId = $companyId ?? app(TenantContext::class)->companyId();

        return ActivityLog::query()->create([
            'company_id' => $companyId,
            'user_id' => $user?->id,
            'action' => $action,
            'subject_type' => $subject ? $subject::class : null,
            'subject_id' => $subject?->getKey(),
            'properties' => $properties ?: null,
            'ip_address' => Request::ip(),
        ]);
    }
}
