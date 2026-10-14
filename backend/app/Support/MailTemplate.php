<?php

namespace App\Support;

class MailTemplate
{
    public static function wrap(string $title, string $subtitle, string $bodyHtml): string
    {
        $app = e(config('app.name', 'BizFlow'));
        $title = e($title);
        $subtitle = e($subtitle);
        $year = date('Y');

        return <<<HTML
<!DOCTYPE html>
<html lang="sq">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{$title}</title>
</head>
<body style="margin:0;padding:0;background:#f0fdfa;font-family:'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f0fdfa;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(13,148,136,0.12);">
          <tr>
            <td style="background:linear-gradient(135deg,#0f766e 0%,#0d9488 45%,#ea580c 120%);padding:32px 28px;color:#ffffff;">
              <div style="font-size:13px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.9;font-weight:700;">{$app}</div>
              <h1 style="margin:12px 0 8px;font-size:28px;line-height:1.25;font-weight:800;color:#ffffff;">{$title}</h1>
              <p style="margin:0;font-size:15px;line-height:1.5;color:rgba(255,255,255,0.92);">{$subtitle}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;color:#3f3f46;font-size:15px;line-height:1.65;">
              {$bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 28px;border-top:1px solid #e4e4e7;background:#fafafa;">
              <p style="margin:0;color:#0d9488;font-weight:700;">Ekipi {$app}</p>
              <p style="margin:6px 0 0;color:#a1a1aa;font-size:12px;">© {$year} {$app}. Menaxho biznesin më thjeshtë.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
    }

    public static function codeBox(string $code): string
    {
        $code = e($code);

        return <<<HTML
<div style="margin:24px 0;text-align:center;">
  <div style="display:inline-block;background:#ecfdf5;border:1px dashed #0d9488;border-radius:14px;padding:18px 28px;">
    <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#0f766e;font-weight:700;margin-bottom:8px;">Verification code</div>
    <div style="font-size:36px;letter-spacing:10px;font-weight:800;color:#134e4a;">{$code}</div>
  </div>
</div>
HTML;
    }

    public static function button(string $url, string $label): string
    {
        $safeUrl = e($url);
        $label = e($label);

        return <<<HTML
<p style="margin:28px 0 8px;text-align:center;">
  <a href="{$safeUrl}" style="background:linear-gradient(135deg,#0d9488,#0f766e);color:#ffffff;text-decoration:none;padding:14px 26px;border-radius:999px;font-weight:700;display:inline-block;box-shadow:0 8px 20px rgba(13,148,136,0.28);">
    {$label}
  </a>
</p>
<p style="margin:0 0 8px;text-align:center;color:#71717a;font-size:13px;line-height:1.5;word-break:break-all;">
  Ose hap këtë link:<br>
  <a href="{$safeUrl}" style="color:#0f766e;font-weight:600;text-decoration:underline;">{$safeUrl}</a>
</p>
HTML;
    }

    public static function frontendUrl(string $path = '/'): string
    {
        $base = rtrim((string) config('app.frontend_url', config('app.url')), '/');
        $path = '/'.ltrim($path, '/');

        if ($path === '/') {
            return $base.'/';
        }

        return $base.$path;
    }
}
