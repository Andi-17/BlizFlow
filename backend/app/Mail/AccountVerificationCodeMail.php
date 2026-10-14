<?php

namespace App\Mail;

use App\Support\MailTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AccountVerificationCodeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $code,
        public string $userName,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Kodi yt i verifikimit — BizFlow',
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
        $body = <<<HTML
<p style="margin-top:0;">Përshëndetje <strong>{$name}</strong>,</p>
<p>Po krijuan llogarinë në <strong>BizFlow</strong>. Vendos këtë kod për të vazhduar:</p>
{$this->codeBox()}
<p style="color:#71717a;font-size:14px;margin-bottom:0;">Kodi skadon pas 15 minutash. Nëse nuk e kërkove ti, injoro këtë email.</p>
HTML;

        return MailTemplate::wrap(
            'Verifiko email-in',
            'Një hap para se të hyjmë në panel',
            $body,
        );
    }

    protected function codeBox(): string
    {
        return MailTemplate::codeBox($this->code);
    }
}
