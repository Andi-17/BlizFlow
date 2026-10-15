# syntax=docker/dockerfile:1

FROM node:22-alpine AS frontend
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# Same-origin: browser calls /api, /sanctum, /auth/google on this host.
ENV VITE_API_URL=
RUN npm run build

FROM composer:2 AS vendor
WORKDIR /app
COPY backend/composer.json backend/composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist
COPY backend/ ./
RUN composer dump-autoload --optimize --no-dev --classmap-authoritative \
    && rm -rf tests .env .env.example

FROM php:8.3-fpm-alpine
RUN apk add --no-cache \
        nginx \
        supervisor \
        bash \
        curl \
        icu-dev \
        libpng-dev \
        libjpeg-turbo-dev \
        freetype-dev \
        libzip-dev \
        oniguruma-dev \
        mysql-client \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) pdo_mysql mbstring exif bcmath gd zip intl opcache \
    && mkdir -p /run/nginx /var/log/supervisor

COPY --from=vendor /app /var/www/html
COPY --from=frontend /frontend/dist /var/www/frontend
COPY deploy/nginx.conf /etc/nginx/http.d/default.conf
COPY deploy/supervisord.conf /etc/supervisord.conf
COPY deploy/php-fpm.conf /usr/local/etc/php-fpm.d/zz-bizflow.conf
COPY deploy/php.ini /usr/local/etc/php/conf.d/bizflow.ini
COPY deploy/entrypoint.sh /entrypoint.sh

RUN sed -i 's/\r$//' /entrypoint.sh \
    && chmod +x /entrypoint.sh \
    && mkdir -p \
        /var/www/html/storage/framework/cache/data \
        /var/www/html/storage/framework/sessions \
        /var/www/html/storage/framework/views \
        /var/www/html/storage/logs \
        /var/www/html/bootstrap/cache \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

WORKDIR /var/www/html
ENV PORT=8080
EXPOSE 8080
CMD ["/entrypoint.sh"]
