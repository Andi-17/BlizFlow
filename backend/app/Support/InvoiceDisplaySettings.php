<?php

namespace App\Support;

class InvoiceDisplaySettings
{
    public static function defaults(?string $industry = null): array
    {
        $settings = [
            'show_logo' => true,
            'show_company_name' => true,
            'show_company_address' => true,
            'show_company_phone' => true,
            'show_company_email' => true,
            'show_customer_name' => true,
            'show_customer_email' => true,
            'show_customer_phone' => false,
            'show_customer_address' => true,
            'show_notes' => true,
            'show_issue_date' => true,
            'show_due_date' => true,
            'show_status' => true,
            'custom_title' => null,
            'custom_footer' => null,
        ];

        return match ($industry) {
            'restaurant', 'bakery', 'cafe' => array_merge($settings, [
                'show_customer_address' => false,
                'show_customer_phone' => true,
                'custom_title' => 'Receipt',
            ]),
            'barber', 'beauty', 'clinic', 'fitness', 'dental' => array_merge($settings, [
                'show_customer_phone' => true,
                'show_customer_address' => false,
            ]),
            'mechanic', 'plumber', 'electrician', 'construction' => array_merge($settings, [
                'show_customer_address' => true,
                'show_customer_phone' => true,
                'show_notes' => true,
            ]),
            'retail', 'clothing_boutique', 'shoe_store', 'grocery', 'electronics', 'jewelry', 'furniture' => array_merge($settings, [
                'show_customer_name' => false,
                'show_customer_email' => false,
                'show_customer_address' => false,
                'custom_title' => 'Sales receipt',
            ]),
            'hotel' => array_merge($settings, [
                'show_customer_phone' => true,
                'show_customer_address' => true,
                'custom_title' => 'Folio',
            ]),
            default => $settings,
        };
    }

    public static function normalize(mixed $value, ?string $industry = null): array
    {
        $defaults = self::defaults($industry);
        $parsed = [];

        if (is_string($value) && $value !== '') {
            $decoded = json_decode($value, true);
            if (is_array($decoded)) {
                $parsed = $decoded;
            }
        } elseif (is_array($value)) {
            $parsed = $value;
        }

        $merged = array_merge($defaults, $parsed);

        foreach ([
            'show_logo',
            'show_company_name',
            'show_company_address',
            'show_company_phone',
            'show_company_email',
            'show_customer_name',
            'show_customer_email',
            'show_customer_phone',
            'show_customer_address',
            'show_notes',
            'show_issue_date',
            'show_due_date',
            'show_status',
        ] as $flag) {
            $merged[$flag] = filter_var($merged[$flag] ?? false, FILTER_VALIDATE_BOOLEAN);
        }

        $merged['custom_title'] = filled($merged['custom_title'] ?? null)
            ? (string) $merged['custom_title']
            : null;
        $merged['custom_footer'] = filled($merged['custom_footer'] ?? null)
            ? (string) $merged['custom_footer']
            : null;

        return $merged;
    }
}
