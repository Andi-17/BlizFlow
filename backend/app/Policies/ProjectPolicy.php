<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    use ChecksCompanyAccess;

    public function viewAny(User $user): bool
    {
        return $this->allowsAny($user, ['projects.view', 'projects.manage']);
    }

    public function view(User $user, Project $project): bool
    {
        return $this->sameCompany($user, $project)
            && $this->allowsAny($user, ['projects.view', 'projects.manage']);
    }

    public function create(User $user): bool
    {
        return $this->allows($user, 'projects.manage');
    }

    public function update(User $user, Project $project): bool
    {
        return $this->sameCompany($user, $project) && $this->allows($user, 'projects.manage');
    }

    public function delete(User $user, Project $project): bool
    {
        return $this->sameCompany($user, $project) && $this->allows($user, 'projects.manage');
    }
}
