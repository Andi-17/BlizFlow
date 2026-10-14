<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ConfirmRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'max:255'],
            'verification_code' => ['required', 'string', 'size:6'],
            'device_name' => ['nullable', 'string', 'max:255'],
            'issue_token' => ['nullable', 'boolean'],
        ];
    }
}
