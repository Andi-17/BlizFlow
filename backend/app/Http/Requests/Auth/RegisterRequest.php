<?php

namespace App\Http\Requests\Auth;

use App\Support\IndustryCatalog;
use App\Support\RegionDefaults;
use App\Support\UsernameRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
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

        if ($this->filled('country')) {
            $this->merge([
                'country' => strtoupper(trim($this->string('country')->toString())),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'username' => UsernameRules::create(),
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'company_name' => ['nullable', 'string', 'max:255'],
            'country' => ['required', 'string', Rule::in(RegionDefaults::countryCodes())],
            'industry' => ['nullable', 'string', Rule::in(IndustryCatalog::keys())],
            'plan' => ['nullable', 'string', 'exists:plans,slug'],
        ];
    }

    public function messages(): array
    {
        return [
            'username.regex' => 'Username may only contain letters, numbers, dots and underscores.',
            'username.unique' => 'This username is already taken.',
            'country.required' => 'Please select your country.',
            'country.in' => 'Please select a valid country.',
        ];
    }
}
