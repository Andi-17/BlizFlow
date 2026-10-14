<?php

namespace App\Mail;

use App\Models\Company;
use App\Support\MailTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BusinessLandingContactMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Company $company,
        public string $senderName,
        public string $senderEmail,
        public string $body,
        public ?string $subjectLine = null,
    ) {
    }

    public function envelope(): Envelope
    {
        $subject = $this->subjectLine
            ?: ('New message for '.$this->company->name);

        return new Envelope(
            subject: $subject,
            replyTo: [$this->senderEmail],
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
        $companyName = e($this->company->name);
        $senderName = e($this->senderName);
        $senderEmail = e($this->senderEmail);
        $message = nl2br(e($this->body));
        $subject = e($this->subjectLine ?: 'Website contact');

        $body = <<<HTML
<p style="margin-top:0;">You received a new message from your <strong>{$companyName}</strong> landing page.</p>
<div style="background:#f8faf9;border-radius:12px;padding:14px 16px;margin:16px 0;">
  <p style="margin:0 0 8px;"><strong>From:</strong> {$senderName}</p>
  <p style="margin:0 0 8px;"><strong>Email:</strong> {$senderEmail}</p>
  <p style="margin:0;"><strong>Subject:</strong> {$subject}</p>
</div>
<p style="margin-bottom:6px;"><strong>Message:</strong></p>
<div style="border-left:3px solid #1f6f50;padding-left:14px;color:#3f3f46;">{$message}</div>
<p style="color:#71717a;font-size:14px;margin-top:18px;">Reply directly to this email to answer the customer.</p>
HTML;

        return MailTemplate::wrap(
            'New landing page message',
            $companyName,
            $body,
        );
    }
}
