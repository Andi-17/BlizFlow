<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'assigned_to' => $this->assigned_to,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'priority' => $this->priority,
            'due_date' => $this->due_date,
            'notes' => $this->notes,
            'assignee' => new UserResource($this->whenLoaded('assignee')),
            'project' => new ProjectResource($this->whenLoaded('project')),
            'created_at' => $this->created_at,
        ];
    }
}