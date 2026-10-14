<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Project\StoreProjectRequest;
use App\Http\Requests\Api\Project\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('viewAny', Project::class);

        $projects = Project::query()
            ->withCount('tasks')
            ->when($request->status, fn ($query, $status) => $query->where('status', $status))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return $this->success(ProjectResource::collection($projects)->response()->getData(true));
    }

    public function store(StoreProjectRequest $request)
    {
        Gate::authorize('create', Project::class);

        $project = Project::query()->create($request->validated());

        return $this->created(new ProjectResource($project));
    }

    public function show(Project $project)
    {
        Gate::authorize('view', $project);

        return $this->success(new ProjectResource($project->load('tasks')));
    }

    public function update(UpdateProjectRequest $request, Project $project)
    {
        Gate::authorize('update', $project);

        $project->update($request->validated());

        return $this->success(new ProjectResource($project), 'Project updated');
    }

    public function destroy(Project $project)
    {
        Gate::authorize('delete', $project);

        $project->delete();

        return $this->success(null, 'Project deleted');
    }
}
