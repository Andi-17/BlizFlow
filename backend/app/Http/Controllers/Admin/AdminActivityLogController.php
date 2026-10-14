<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class AdminActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $logs = ActivityLog::query()
            ->with(['user:id,name,email', 'company:id,name'])
            ->when($request->filled('action'), fn ($query) => $query->where('action', $request->string('action')))
            ->latest()
            ->paginate((int) $request->integer('per_page', 25));

        $payload = $logs->toArray();
        $payload['data'] = $logs->getCollection()->map(fn (ActivityLog $log) => [
            'id' => $log->id,
            'company_id' => $log->company_id,
            'company' => $log->company?->only(['id', 'name']),
            'user_id' => $log->user_id,
            'user' => $log->user?->only(['id', 'name', 'email']),
            'action' => $log->action,
            'subject_type' => $log->subject_type,
            'subject_id' => $log->subject_id,
            'properties' => $log->properties,
            'ip_address' => $log->ip_address,
            'created_at' => $log->created_at,
        ])->values()->all();

        return $this->success($payload);
    }
}
