<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Task\StoreTaskRequest;
use App\Http\Requests\Api\Task\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Mail\TaskAssignedMail;
use App\Models\Task;
use App\Models\User;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Mail;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('viewAny', Task::class);

        $tasks = Task::query()
            ->with(['assignee', 'project'])
            ->when($request->status, fn ($query, $status) => $query->where('status', $status))
            ->when($request->project_id, fn ($query, $projectId) => $query->where('project_id', $projectId))
            ->when($request->assigned_to, fn ($query, $userId) => $query->where('assigned_to', $userId))
            ->when(
                ! $request->user()->canManageTeam() && ! $request->user()->isCompanyAdmin(),
                fn ($query) => $query->where('assigned_to', $request->user()->id)
            )
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return $this->success(TaskResource::collection($tasks)->response()->getData(true));
    }

    public function store(StoreTaskRequest $request, TenantContext $tenantContext)
    {
        Gate::authorize('create', Task::class);

        $task = Task::query()->create($request->validated());
        $task->load(['assignee', 'project']);

        $this->notifyAssignee($task, $request->user(), $tenantContext);

        return $this->created(new TaskResource($task));
    }

    public function show(Task $task)
    {
        Gate::authorize('view', $task);

        return $this->success(new TaskResource($task->load(['assignee', 'project'])));
    }

    public function update(UpdateTaskRequest $request, Task $task, TenantContext $tenantContext)
    {
        Gate::authorize('update', $task);

        $previousAssigneeId = $task->assigned_to;
        $task->update($request->validated());
        $task->load(['assignee', 'project']);

        if ($task->assigned_to && (int) $task->assigned_to !== (int) $previousAssigneeId) {
            $this->notifyAssignee($task, $request->user(), $tenantContext);
        }

        return $this->success(new TaskResource($task), 'Task updated');
    }

    public function destroy(Task $task)
    {
        Gate::authorize('delete', $task);

        $task->delete();

        return $this->success(null, 'Task deleted');
    }

    protected function notifyAssignee(Task $task, ?User $assignedBy, TenantContext $tenantContext): void
    {
        if (! $task->assigned_to || ! $task->assignee?->email) {
            return;
        }

        $company = $tenantContext->company();
        if (! $company) {
            return;
        }

        Mail::to($task->assignee->email)->send(new TaskAssignedMail(
            $task->assignee,
            $task,
            $company,
            $assignedBy,
        ));
    }
}
