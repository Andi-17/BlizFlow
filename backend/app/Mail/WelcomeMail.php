<?php

namespace App\Mail;

use App\Support\MailTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $userName,
        public ?string $companyName = null,
        public bool $isPlatformAdmin = false,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Mirë se vini në website-in tonë — BizFlow',
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
        $dashboardUrl = MailTemplate::frontendUrl($this->isPlatformAdmin ? '/admin' : '/app');
        $loginUrl = e(MailTemplate::frontendUrl('/login'));
        $panelLabel = $this->isPlatformAdmin ? 'Hap admin panelin' : 'Hap dashboard-in';

        $companyBlock = $this->companyName
            ? '<div style="background:#ecfdf5;border-radius:12px;padding:14px 16px;margin:16px 0;"><strong style="color:#0f766e;">Workspace gati:</strong> '.e($this->companyName).'</div>'
            : '<p>Hapi tjetër: krijo kompaninë tënde dhe fto ekipin.</p>';

        $button = MailTemplate::button($dashboardUrl, $panelLabel);

        $body = <<<HTML
<p style="margin-top:0;">Përshëndetje <strong>{$name}</strong>,</p>
<p><strong>Mirë se vini në website-in tonë!</strong> Llogaria jote u verifikua me sukses dhe tani je pjesë e <strong>BizFlow</strong>.</p>
<p>Këtu menaxhon biznesin tënd me panela të përshtatura për mekanik, salon, restorant, klinikë e shumë të tjera — klientë, porosi, stok, fatura, detyra dhe performancë ekipi.</p>
{$companyBlock}
<p style="margin-bottom:6px;"><strong>Filloni kështu:</strong></p>
<ol style="margin-top:0;padding-left:18px;color:#52525b;">
  <li>Hap dashboard-in e kompanisë me butonin më poshtë</li>
  <li>Shto logo (opsionale) dhe të dhënat e biznesit</li>
  <li>Fto worker-ë me emër ose username</li>
  <li>Krijo porosinë e parë dhe cakto detyra</li>
</ol>
{$button}
<p style="text-align:center;color:#71717a;font-size:13px;">
  Nëse nuk je i identifikuar, hyr së pari këtu:
  <a href="{$loginUrl}" style="color:#0f766e;font-weight:600;">{$loginUrl}</a>
</p>
<p style="color:#71717a;font-size:14px;">Nëse nuk e krijove ti këtë llogari, na njofto.</p>
HTML;

        return MailTemplate::wrap(
            'Mirë se vini në website-in tonë',
            'Llogaria u aktivizua — hap dashboard-in',
            $body,
        );
    }
}
