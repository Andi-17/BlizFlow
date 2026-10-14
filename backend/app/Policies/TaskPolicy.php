<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    use ChecksCompanyAccess;

    public function viewAny(User $user): bool
    {
        return $this->allowsAny($user, ['tasks.view', 'tasks.manage']);
    }

    public function view(User $user, Task $task): bool
    {
        if (! $this->sameCompany($user, $task)) {
            return false;
        }

        if ($this->allows($user, 'performance.team') || $this->allows($user, 'tasks.manage')) {
            return true;
        }

        return (int) $task->assigned_to === (int) $user->id;
    }

    public function create(User $user): bool
    {
        return $this->allowsAny($user, ['tasks.manage', 'performance.team']);
    }

    public function update(User $user, Task $task): bool
    {
        if (! $this->sameCompany($user, $task)) {
            return false;
        }

        if ($this->allows($user, 'tasks.manage') || $this->allows($user, 'performance.team')) {
            return true;
        }

        return (int) $task->assigned_to === (int) $user->id;
    }

    public function delete(User $user, Task $task): bool
    {
        return $this->sameCompany($user, $task) && $this->allows($user, 'tasks.manage');
    }
}
