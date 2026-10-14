<?php

namespace App\Support;

use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class MailSender
{
    /**
     * @return array{delivered: bool, channel: string, error: ?string}
     */
    public static function send(string $email, Mailable $mailable): array
    {
        $mailer = (string) config('mail.default', 'log');
        $smtpPassword = (string) config('mail.mailers.smtp.password', '');

        if ($mailer === 'smtp' && $smtpPassword === '') {
            Log::warning('Mail SMTP selected but MAIL_PASSWORD is empty.');

            return [
                'delivered' => false,
                'channel' => 'misconfigured',
                'error' => 'SMTP is selected but MAIL_PASSWORD is empty in .env',
            ];
        }

        try {
            Mail::mailer($mailer)->to($email)->send($mailable);

            return [
                'delivered' => $mailer === 'smtp',
                'channel' => $mailer,
                'error' => null,
            ];
        } catch (Throwable $exception) {
            Log::error('Mail send failed: '.$exception->getMessage(), [
                'email' => $email,
                'mailable' => $mailable::class,
            ]);

            return [
                'delivered' => false,
                'channel' => $mailer,
                'error' => $exception->getMessage(),
            ];
        }
    }

    public static function shouldShowCode(?array $sendResult = null): bool
    {
        if (! app()->environment(['local', 'testing'])) {
            return false;
        }

        $mailer = (string) config('mail.default', 'log');
        if (in_array($mailer, ['log', 'array'], true)) {
            return true;
        }

        return is_array($sendResult) && $sendResult['delivered'] === false;
    }
}
