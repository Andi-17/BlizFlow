<?php

namespace App\Http\Requests\Api\Employee;

use App\Support\UsernameRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('username')) {
            $this->merge([
                'username' => UsernameRules::normalize($this->string('username')->toString()),
            ]);
        }
    }

    public function rules(): array
    {
        $creatingAccount = ! $this->filled('user_id');

        return [
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'name' => [Rule::requiredIf($creatingAccount), 'nullable', 'string', 'max:255'],
            'username' => $creatingAccount
                ? UsernameRules::create()
                : ['nullable', 'string'],
            'email' => [
                Rule::requiredIf($creatingAccount),
                'nullable',
                'email',
                'max:255',
                Rule::unique('users', 'email'),
            ],
            'password' => [Rule::requiredIf($creatingAccount), 'nullable', 'string', Password::defaults()],
            'role_id' => ['nullable', 'integer', 'exists:roles,id'],
            'status' => ['nullable', 'in:active,inactive'],
        ];
    }

    public function messages(): array
    {
        return [
            'username.regex' => 'Username may only contain letters, numbers, dots and underscores.',
            'username.unique' => 'This username is already taken.',
            'user_id.exists' => 'No account found for that worker.',
            'password.required' => 'Set a password the worker will use to sign in.',
        ];
    }
}
