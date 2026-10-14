<?php

namespace App\Http\Requests\Api\Company;

use Illuminate\Foundation\Http\FormRequest;

class DeleteCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'password' => ['required', 'string'],
            'confirmation' => ['required', 'string', 'in:DELETE'],
        ];
    }

    public function messages(): array
    {
        return [
            'confirmation.in' => 'Type DELETE to confirm company deletion.',
        ];
    }
}
