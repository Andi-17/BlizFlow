<?php

namespace App\Support;

class LandingPageSettings
{
    public const MAX_HIGHLIGHTS = 24;

    /**
     * @return array{google_maps_url: ?string, google_maps_embed: ?string, highlights_title: ?string, highlights: list<array{name: string, price: ?string, description: ?string}>}
     */
    public static function defaults(?string $industry = null): array
    {
        return [
            'google_maps_url' => null,
            'google_maps_embed' => null,
            'highlights_title' => self::defaultHighlightsTitle($industry),
            'highlights' => [],
        ];
    }

    public static function defaultHighlightsTitle(?string $industry): string
    {
        return match ($industry) {
            'barber', 'beauty' => 'Service prices',
            'clothing_boutique', 'shoe_store', 'tailor' => 'Featured pieces',
            'restaurant', 'cafe', 'bakery' => 'Menu highlights',
            'mechanic', 'plumber', 'electrician', 'carpenter' => 'Common jobs & prices',
            'clinic', 'dental', 'fitness' => 'Treatments & packages',
            'pharmacy' => 'Popular products',
            'photography' => 'Packages',
            'hotel' => 'Rooms & rates',
            'education' => 'Courses & fees',
            'grocery', 'electronics', 'jewelry', 'furniture', 'retail', 'florist' => 'Featured products',
            default => 'Highlights',
        };
    }

    /**
     * @return array{google_maps_url: ?string, google_maps_embed: ?string, highlights_title: ?string, highlights: list<array{name: string, price: ?string, description: ?string}>}
     */
    public static function normalize(mixed $value, ?string $industry = null): array
    {
        $defaults = self::defaults($industry);
        $parsed = [];

        if (is_string($value) && $value !== '') {
            $decoded = json_decode($value, true);
            if (is_array($decoded)) {
                $parsed = $decoded;
            }
        } elseif (is_array($value)) {
            $parsed = $value;
        }

        $mapsUrl = self::sanitizeMapsUrl($parsed['google_maps_url'] ?? null);
        $mapsEmbed = self::sanitizeMapsEmbedUrl($parsed['google_maps_embed'] ?? null);

        if (! $mapsEmbed && $mapsUrl) {
            $mapsEmbed = self::embedFromMapsUrl($mapsUrl);
        }

        $title = trim((string) ($parsed['highlights_title'] ?? ''));
        if ($title === '') {
            $title = $defaults['highlights_title'];
        }

        $highlights = [];
        $rawHighlights = $parsed['highlights'] ?? [];
        if (is_array($rawHighlights)) {
            foreach (array_slice($rawHighlights, 0, self::MAX_HIGHLIGHTS) as $row) {
                if (! is_array($row)) {
                    continue;
                }
                $name = trim((string) ($row['name'] ?? ''));
                if ($name === '') {
                    continue;
                }
                $price = trim((string) ($row['price'] ?? ''));
                $description = trim((string) ($row['description'] ?? ''));
                $highlights[] = [
                    'name' => mb_substr($name, 0, 120),
                    'price' => $price !== '' ? mb_substr($price, 0, 40) : null,
                    'description' => $description !== '' ? mb_substr($description, 0, 240) : null,
                ];
            }
        }

        return [
            'google_maps_url' => $mapsUrl,
            'google_maps_embed' => $mapsEmbed,
            'highlights_title' => mb_substr($title, 0, 120),
            'highlights' => $highlights,
        ];
    }

    public static function sanitizeMapsUrl(mixed $url): ?string
    {
        $url = trim((string) $url);
        if ($url === '' || filter_var($url, FILTER_VALIDATE_URL) === false) {
            return null;
        }

        $host = strtolower((string) parse_url($url, PHP_URL_HOST));
        $allowed = [
            'google.com',
            'www.google.com',
            'maps.google.com',
            'maps.app.goo.gl',
            'goo.gl',
            'g.page',
        ];

        foreach ($allowed as $allowedHost) {
            if ($host === $allowedHost || str_ends_with($host, '.'.$allowedHost)) {
                return $url;
            }
        }

        return null;
    }

    public static function sanitizeMapsEmbedUrl(mixed $url): ?string
    {
        $url = trim((string) $url);
        if ($url === '') {
            return null;
        }

        // Accept pasted iframe markup and extract src.
        if (str_contains($url, '<iframe')) {
            if (preg_match('/src=["\']([^"\']+)["\']/i', $url, $matches)) {
                $url = html_entity_decode($matches[1]);
            } else {
                return null;
            }
        }

        if (filter_var($url, FILTER_VALIDATE_URL) === false) {
            return null;
        }

        $host = strtolower((string) parse_url($url, PHP_URL_HOST));
        if (! in_array($host, ['www.google.com', 'google.com', 'maps.google.com'], true)) {
            return null;
        }

        $path = (string) parse_url($url, PHP_URL_PATH);
        $query = (string) parse_url($url, PHP_URL_QUERY);

        $isEmbed = str_contains($path, '/maps/embed')
            || str_contains($query, 'output=embed')
            || str_contains($path, '/maps');

        return $isEmbed ? $url : null;
    }

    public static function embedFromMapsUrl(?string $mapsUrl): ?string
    {
        if (! $mapsUrl) {
            return null;
        }

        $parts = parse_url($mapsUrl);
        if (! is_array($parts)) {
            return null;
        }

        $path = (string) ($parts['path'] ?? '');
        if (str_contains($path, '/maps/embed')) {
            return $mapsUrl;
        }

        // Place / search URLs → simple embed by query
        $query = [];
        if (! empty($parts['query'])) {
            parse_str($parts['query'], $query);
        }

        if (! empty($query['q'])) {
            return 'https://www.google.com/maps?q='.rawurlencode((string) $query['q']).'&output=embed';
        }

        // /maps/place/Name/@lat,lng or /maps/@lat,lng
        if (preg_match('/@(-?\d+\.\d+),(-?\d+\.\d+)/', $mapsUrl, $coords)) {
            return 'https://www.google.com/maps?q='.rawurlencode($coords[1].','.$coords[2]).'&output=embed';
        }

        if (preg_match('#/maps/place/([^/]+)#', $path, $place)) {
            return 'https://www.google.com/maps?q='.rawurlencode(urldecode($place[1])).'&output=embed';
        }

        return null;
    }
}
