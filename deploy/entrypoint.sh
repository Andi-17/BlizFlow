#!/usr/bin/env bash
set -euo pipefail

cd /var/www/html

PORT="${PORT:-8080}"
sed -i "s/LISTEN_PORT/${PORT}/g" /etc/nginx/http.d/default.conf

if [ -n "${MYSQLHOST:-}" ]; then
  export DB_CONNECTION="${DB_CONNECTION:-mysql}"
  export DB_HOST="${MYSQLHOST}"
  export DB_PORT="${MYSQLPORT:-3306}"
  export DB_DATABASE="${MYSQLDATABASE:-railway}"
  export DB_USERNAME="${MYSQLUSER:-root}"
  export DB_PASSWORD="${MYSQLPASSWORD:-}"
fi

if [ -z "${DB_URL:-}" ] && [ -n "${MYSQL_URL:-}" ]; then
  export DB_URL="${MYSQL_URL}"
fi
if [ -z "${DB_URL:-}" ] && [ -n "${DATABASE_URL:-}" ]; then
  export DB_URL="${DATABASE_URL}"
fi

if [ -z "${APP_URL:-}" ] && [ -n "${RAILWAY_PUBLIC_DOMAIN:-}" ]; then
  export APP_URL="https://${RAILWAY_PUBLIC_DOMAIN}"
fi

if [ -z "${FRONTEND_URL:-}" ] && [ -n "${APP_URL:-}" ]; then
  export FRONTEND_URL="${APP_URL}"
fi

if [ -z "${GOOGLE_REDIRECT_URI:-}" ] && [ -n "${APP_URL:-}" ]; then
  export GOOGLE_REDIRECT_URI="${APP_URL}/auth/google/callback"
fi

if [ -z "${SANCTUM_STATEFUL_DOMAINS:-}" ] && [ -n "${APP_URL:-}" ]; then
  export SANCTUM_STATEFUL_DOMAINS="$(echo "${APP_URL}" | sed -E 's#^https?://##')"
fi

export APP_ENV="${APP_ENV:-production}"
export APP_DEBUG="${APP_DEBUG:-false}"
export LOG_CHANNEL="${LOG_CHANNEL:-stderr}"
export SESSION_DRIVER="${SESSION_DRIVER:-database}"
export CACHE_STORE="${CACHE_STORE:-database}"
export QUEUE_CONNECTION="${QUEUE_CONNECTION:-sync}"
export SESSION_SECURE_COOKIE="${SESSION_SECURE_COOKIE:-true}"

if [ -z "${APP_KEY:-}" ]; then
  echo "APP_KEY is required. Generate one with: php artisan key:generate --show"
  echo "Then paste it into the hosting dashboard. Do not commit it to Git."
  exit 1
fi

mkdir -p storage/framework/{cache/data,sessions,views} storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache || true

echo "Waiting for MySQL..."
php -r '
$tries = 30;
$host = getenv("DB_HOST") ?: "127.0.0.1";
$port = (int) (getenv("DB_PORT") ?: 3306);
$url = getenv("DB_URL") ?: getenv("DATABASE_URL") ?: getenv("MYSQL_URL");
if ($url) {
    $parts = parse_url($url);
    if (!empty($parts["host"])) {
        $host = $parts["host"];
    }
    if (!empty($parts["port"])) {
        $port = (int) $parts["port"];
    }
}
for ($i = 1; $i <= $tries; $i++) {
    $errno = 0;
    $errstr = "";
    $fp = @fsockopen($host, $port, $errno, $errstr, 2);
    if ($fp) {
        fclose($fp);
        fwrite(STDOUT, "MySQL port is open.\n");
        exit(0);
    }
    fwrite(STDOUT, "MySQL not ready ({$i}/{$tries}): {$errstr}\n");
    sleep(2);
}
fwrite(STDERR, "MySQL did not become ready.\n");
exit(1);
'

php artisan migrate --force
php artisan db:seed --force
php artisan storage:link || true
php artisan config:cache
php artisan view:cache

exec /usr/bin/supervisord -c /etc/supervisord.conf
