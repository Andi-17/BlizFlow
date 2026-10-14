<?php

namespace App\Support;

use Illuminate\Validation\Rule;

class UsernameRules
{
    /**
     * @return array<int, mixed>
     */
    public static function create(?int $ignoreUserId = null): array
    {
        $unique = Rule::unique('users', 'username');
        if ($ignoreUserId) {
            $unique = $unique->ignore($ignoreUserId);
        }

        return [
            'required',
            'string',
            'min:3',
            'max:50',
            'regex:/^[a-zA-Z0-9._]+$/',
            $unique,
        ];
    }

    public static function normalize(string $username): string
    {
        return mb_strtolower(trim($username), 'UTF-8');
    }
}
