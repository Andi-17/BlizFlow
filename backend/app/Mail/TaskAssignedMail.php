<?php

namespace App\Mail;

use App\Models\Company;
use App\Models\Task;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TaskAssignedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $worker,
        public Task $task,
        public Company $company,
        public ?User $assignedBy = null,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New job assigned: '.$this->task->title,
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
        $title = e($this->task->title);
        $company = e($this->company->name);
        $due = $this->task->due_date ? e((string) $this->task->due_date) : 'No due date';
        $priority = e($this->task->priority ?? 'medium');
        $description = e($this->task->description ?: 'No extra details.');
        $by = $this->assignedBy ? e($this->assignedBy->name) : 'your manager';

        return <<<HTML
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #18181b;">
          <h1 style="font-size: 22px; margin-bottom: 8px;">New job assigned</h1>
          <p style="color: #52525b;">Hi {$name},</p>
          <p style="color: #52525b;">{$by} assigned you a job in <strong>{$company}</strong>.</p>
          <div style="background: #f4f4f5; border-radius: 12px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px; font-size: 18px; font-weight: 700;">{$title}</p>
            <p style="margin: 0 0 8px; color: #52525b;">{$description}</p>
            <p style="margin: 0; color: #71717a; font-size: 14px;">Priority: {$priority} · Due: {$due}</p>
          </div>
          <p style="color: #52525b;">Open BizFlow and go to <strong>My work</strong> to start.</p>
        </div>
        HTML;
    }
}
