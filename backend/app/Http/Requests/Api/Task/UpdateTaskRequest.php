<?php

namespace App\Http\Requests\Api\Task;

use App\Models\CompanyUser;
use App\Services\TenantContext;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'max:50'],
            'priority' => ['nullable', 'string', 'max:50'],
            'due_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if (! $this->exists('assigned_to') || $this->input('assigned_to') === null || $this->input('assigned_to') === '') {
                return;
            }

            $assigneeId = $this->input('assigned_to');
            $companyId = app(TenantContext::class)->companyId();
            $isMember = CompanyUser::query()
                ->where('company_id', $companyId)
                ->where('user_id', $assigneeId)
                ->where('status', 'active')
                ->exists();

            if (! $isMember) {
                $validator->errors()->add('assigned_to', 'Assignee must be an active member of this company.');
            }
        });
    }
}
