<?php

namespace App\Mail;

use App\Support\MailTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LoginVerificationCodeMail extends Mailable
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
            subject: 'Kodi i login-it — BizFlow',
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
<p>Dikush po përpiqet të hyjë në llogarinë tënde. Përdor këtë kod për të përfunduar login-in:</p>
{$this->codeBox()}
<p style="color:#71717a;font-size:14px;margin-bottom:0;">Kodi skadon pas 10 minutash. Nëse nuk ishe ti, ndrysho fjalëkalimin menjëherë.</p>
HTML;

        return MailTemplate::wrap(
            'Konfirmo hyrjen',
            'Mbrojtje ekstra për llogarinë tënde',
            $body,
        );
    }

    protected function codeBox(): string
    {
        return MailTemplate::codeBox($this->code);
    }
}
