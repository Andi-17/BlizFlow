<?php

namespace App\Mail;

use App\Models\Company;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WorkerJoinedCompanyMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $worker,
        public Company $company,
        public string $roleName,
        public ?User $addedBy = null,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'You joined '.$this->company->name.' on BizFlow',
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
        $name = e($this->worker->name);
        $company = e($this->company->name);
        $role = e($this->roleName);
        $username = e($this->worker->username ?? '');
        $addedBy = $this->addedBy ? e($this->addedBy->name) : 'an admin';

        return <<<HTML
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #18181b;">
          <h1 style="font-size: 22px; margin-bottom: 8px;">Welcome to {$company}</h1>
          <p style="color: #52525b;">Hi {$name},</p>
          <p style="color: #52525b;">{$addedBy} created your worker account for <strong>{$company}</strong> as <strong>{$role}</strong>.</p>
          <p style="color: #52525b;">Sign in on BizFlow with username <strong>@{$username}</strong> and the password your admin gave you. After login you will enter this business as a worker.</p>
          <p style="margin-top: 24px; color: #71717a; font-size: 14px;">If this was unexpected, contact your company admin.</p>
        </div>
        HTML;
    }
}
