<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Invoice;
use App\Support\InvoiceDisplaySettings;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class InvoicePdfService
{
    public function download(Invoice $invoice, Company $company)
    {
        $invoice->loadMissing(['customer', 'items']);
        $company->loadMissing('settings');

        $settingsMap = [];
        foreach ($company->settings as $setting) {
            $settingsMap[$setting->key] = $setting->value;
        }

        $display = InvoiceDisplaySettings::normalize(
            $settingsMap['invoice_settings'] ?? null,
            (string) ($company->industry ?: 'general'),
        );

        $logoDataUri = null;
        if ($display['show_logo'] && $company->logo_path && Storage::disk('public')->exists($company->logo_path)) {
            $absolute = Storage::disk('public')->path($company->logo_path);
            $mime = mime_content_type($absolute) ?: 'image/png';
            $logoDataUri = 'data:'.$mime.';base64,'.base64_encode((string) file_get_contents($absolute));
        }

        $companyAddress = collect([
            $company->address_line1,
            $company->address_line2,
            collect([$company->city, $company->state, $company->postal_code])->filter()->implode(' '),
            $company->country,
        ])->filter()->implode(', ');

        $customer = $invoice->customer;
        $customerAddress = $customer
            ? collect([
                $customer->address_line1,
                $customer->address_line2,
                collect([$customer->city, $customer->state, $customer->postal_code])->filter()->implode(' '),
                $customer->country,
            ])->filter()->implode(', ')
            : null;

        $filename = preg_replace('/[^A-Za-z0-9_\-]/', '_', (string) $invoice->invoice_number).'.pdf';

        $pdf = Pdf::loadView('invoices.pdf', [
            'invoice' => $invoice,
            'company' => $company,
            'display' => $display,
            'logoDataUri' => $logoDataUri,
            'companyAddress' => $companyAddress !== '' ? $companyAddress : null,
            'customerAddress' => $customerAddress !== '' ? $customerAddress : null,
            'title' => $display['custom_title'] ?: 'Invoice',
        ])->setPaper('a4');

        return $pdf->download($filename);
    }
}
