<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ConfirmLoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'verification_code' => ['required', 'string', 'size:6'],
            'remember' => ['nullable', 'boolean'],
            'device_name' => ['nullable', 'string', 'max:255'],
            'issue_token' => ['nullable', 'boolean'],
        ];
    }
}
