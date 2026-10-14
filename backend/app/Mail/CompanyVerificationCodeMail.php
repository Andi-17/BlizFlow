<?php

namespace App\Mail;

use App\Support\MailTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CompanyVerificationCodeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $code,
        public string $companyName,
        public string $userName,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Kodi për kompaninë e re — BizFlow',
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: $this->buildHtml(),
        );
    }

    protected function buildHtml(): string
    {
        $name = e($this->userName);
        $company = e($this->companyName);
        $codeBox = MailTemplate::codeBox($this->code);

        $body = <<<HTML
<p style="margin-top:0;">Përshëndetje <strong>{$name}</strong>,</p>
<p>Po krijuan kompaninë <strong>{$company}</strong>. Vendos këtë kod për të vazhduar:</p>
{$codeBox}
<p style="color:#71717a;font-size:14px;margin-bottom:0;">Kodi skadon pas 15 minutash.</p>
HTML;

        return MailTemplate::wrap(
            'Verifiko kompaninë',
            'Një kod për workspace-in e ri',
            $body,
        );
    }
}
