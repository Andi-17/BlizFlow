<?php

namespace App\Http\Requests\Api\Onboarding;

use App\Support\IndustryCatalog;
use App\Support\RegionDefaults;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class OnboardCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
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
            'slug' => ['nullable', 'string', 'max:255', 'unique:companies,slug'],
            'industry' => ['required', 'string', Rule::in(IndustryCatalog::keys())],
            'tagline' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address_line1' => ['nullable', 'string', 'max:255'],
            'address_line2' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:30'],
            'country' => ['required', 'string', Rule::in(RegionDefaults::countryCodes())],
            'plan' => ['nullable', 'string', 'exists:plans,slug'],
        ];
    }
}
