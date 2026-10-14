<?php

namespace App\Mail;

use App\Support\MailTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LoginWelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $userName,
        public string $loginAt,
        public bool $isPlatformAdmin = false,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Mirë se vini në website-in tonë — u identifikove në BizFlow',
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
        $when = e($this->loginAt);
        $dashboardUrl = MailTemplate::frontendUrl($this->isPlatformAdmin ? '/admin' : '/app');
        $panelLabel = $this->isPlatformAdmin ? 'Hap admin panelin' : 'Hap dashboard-in';
        $button = MailTemplate::button($dashboardUrl, $panelLabel);

        $body = <<<HTML
<p style="margin-top:0;">Përshëndetje <strong>{$name}</strong>,</p>
<p><strong>Mirë se vini në website-in tonë!</strong></p>
<p>U identifikove me sukses në <strong>BizFlow</strong> më <strong>{$when}</strong>. Paneli yt është gati për punën e sotme.</p>
<div style="background:#fff7ed;border-radius:12px;padding:14px 16px;margin:18px 0;border-left:4px solid #ea580c;">
  <strong style="color:#9a3412;">Në panel mund të:</strong>
  <ul style="margin:10px 0 0;padding-left:18px;color:#52525b;">
    <li>Shohësh overview sipas industrisë tënde</li>
    <li>Menaxhosh klientë, porosi dhe fatura</li>
    <li>Caktosh job-e te worker-ët</li>
    <li>Ndjekësh stokun dhe performancën e ekipit</li>
  </ul>
</div>
<p>Faleminderit që na beson. Jemi këtu që biznesi yt të ecë më shpejt dhe më qartë.</p>
{$button}
<p style="color:#71717a;font-size:14px;margin-bottom:0;">Nëse nuk ishe ti, ndrysho fjalëkalimin dhe na kontakto.</p>
HTML;

        return MailTemplate::wrap(
            'Mirë se vini në website-in tonë',
            'Hyrje e suksesshme — hap panelin BizFlow',
            $body,
        );
    }
}
