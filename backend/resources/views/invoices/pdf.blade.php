<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $title }} {{ $invoice->invoice_number }}</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            color: #1a1a1a;
            margin: 0;
            padding: 28px;
        }
        .header {
            width: 100%;
            margin-bottom: 28px;
        }
        .header td { vertical-align: top; }
        .logo { max-height: 56px; max-width: 180px; margin-bottom: 8px; }
        .muted { color: #666; }
        .eyebrow {
            text-transform: uppercase;
            letter-spacing: 0.06em;
            font-size: 10px;
            color: #777;
            margin: 0 0 4px;
        }
        h1 { font-size: 20px; margin: 0 0 6px; }
        h2 { font-size: 16px; margin: 0 0 6px; }
        .meta { text-align: right; }
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border: 1px solid #ccc;
            border-radius: 999px;
            font-size: 10px;
            text-transform: uppercase;
        }
        .party { margin-bottom: 22px; }
        table.items {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0 18px;
        }
        table.items th {
            text-align: left;
            border-bottom: 1px solid #ddd;
            padding: 8px 6px;
            font-size: 11px;
            color: #555;
        }
        table.items td {
            border-bottom: 1px solid #eee;
            padding: 8px 6px;
            vertical-align: top;
        }
        table.items th.num,
        table.items td.num { text-align: right; }
        .totals {
            width: 260px;
            margin-left: auto;
        }
        .totals td { padding: 4px 0; }
        .totals td:last-child { text-align: right; font-weight: bold; }
        .totals .grand td {
            padding-top: 8px;
            border-top: 1px solid #ddd;
            font-size: 14px;
        }
        .notes { margin-top: 24px; }
        .footer {
            margin-top: 36px;
            padding-top: 12px;
            border-top: 1px solid #eee;
            color: #777;
            font-size: 11px;
        }
    </style>
</head>
<body>
    <table class="header">
        <tr>
            <td width="55%">
                @if($display['show_logo'] && $logoDataUri)
                    <img class="logo" src="{{ $logoDataUri }}" alt="">
                @endif
                @if($display['show_company_name'])
                    <h2>{{ $company->name }}</h2>
                @endif
                @if($display['show_company_address'] && $companyAddress)
                    <div class="muted">{{ $companyAddress }}</div>
                @endif
                @if($display['show_company_phone'] && $company->phone)
                    <div class="muted">{{ $company->phone }}</div>
                @endif
                @if($display['show_company_email'] && $company->email)
                    <div class="muted">{{ $company->email }}</div>
                @endif
            </td>
            <td class="meta" width="45%">
                <p class="eyebrow">{{ $title }}</p>
                <h1>{{ $invoice->invoice_number }}</h1>
                @if($display['show_status'])
                    <div class="badge">{{ $invoice->status }}</div>
                @endif
                @if($display['show_issue_date'] && $invoice->issue_date)
                    <div style="margin-top:10px">Issued {{ $invoice->issue_date->format('Y-m-d') }}</div>
                @endif
                @if($display['show_due_date'] && $invoice->due_date)
                    <div>Due {{ $invoice->due_date->format('Y-m-d') }}</div>
                @endif
            </td>
        </tr>
    </table>

    @if($display['show_customer_name'] || $display['show_customer_email'] || $display['show_customer_phone'] || $display['show_customer_address'])
        <div class="party">
            <p class="eyebrow">Bill to</p>
            @if($display['show_customer_name'])
                <strong>{{ $invoice->customer?->name ?: ('Customer #'.$invoice->customer_id) }}</strong>
            @endif
            @if($display['show_customer_email'] && $invoice->customer?->email)
                <div class="muted">{{ $invoice->customer->email }}</div>
            @endif
            @if($display['show_customer_phone'] && $invoice->customer?->phone)
                <div class="muted">{{ $invoice->customer->phone }}</div>
            @endif
            @if($display['show_customer_address'] && $customerAddress)
                <div class="muted">{{ $customerAddress }}</div>
            @endif
        </div>
    @endif

    <table class="items">
        <thead>
            <tr>
                <th>Description</th>
                <th class="num">Qty</th>
                <th class="num">Unit</th>
                <th class="num">Line total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($invoice->items as $item)
                <tr>
                    <td>{{ $item->description }}</td>
                    <td class="num">{{ rtrim(rtrim(number_format((float) $item->quantity, 2, '.', ''), '0'), '.') }}</td>
                    <td class="num">€{{ number_format((float) $item->unit_price, 2) }}</td>
                    <td class="num">€{{ number_format((float) ($item->line_total ?? ((float) $item->quantity * (float) $item->unit_price)), 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr>
            <td>Subtotal</td>
            <td>€{{ number_format((float) $invoice->subtotal, 2) }}</td>
        </tr>
        <tr>
            <td>Discount</td>
            <td>€{{ number_format((float) $invoice->discount, 2) }}</td>
        </tr>
        <tr>
            <td>Tax</td>
            <td>€{{ number_format((float) $invoice->tax, 2) }}</td>
        </tr>
        <tr class="grand">
            <td>Total</td>
            <td>€{{ number_format((float) $invoice->total, 2) }}</td>
        </tr>
    </table>

    @if($display['show_notes'] && $invoice->notes)
        <div class="notes">
            <p class="eyebrow">Notes</p>
            <div>{!! nl2br(e($invoice->notes)) !!}</div>
        </div>
    @endif

    @if(!empty($display['custom_footer']))
        <div class="footer">{{ $display['custom_footer'] }}</div>
    @endif
</body>
</html>
