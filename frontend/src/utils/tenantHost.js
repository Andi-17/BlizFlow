/**
 * Tenant/subdomain helpers for business landing pages.
 * Local:  http://rian.localhost:5173
 * Prod:   https://rian.yourdomain.com
 * IP apex (127.0.0.1): falls back to /b/rian
 */

const RESERVED_SUBDOMAINS = new Set([
  'www',
  'app',
  'api',
  'admin',
  'static',
  'assets',
  'mail',
  'ftp',
  'cdn',
  'dev',
  'staging',
  'test',
])

function stripPort(host) {
  return String(host || '').split(':')[0].toLowerCase()
}

export function getHostname() {
  return stripPort(window.location.hostname)
}

export function getRootDomain() {
  const configured = String(import.meta.env.VITE_ROOT_DOMAIN || '').trim().toLowerCase()
  if (configured) return configured

  const hostname = getHostname()
  if (!hostname || hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return hostname || 'localhost'
  }

  const parts = hostname.split('.').filter(Boolean)
  if (parts.length >= 2 && parts[parts.length - 1] === 'localhost') {
    return 'localhost'
  }
  if (parts.length >= 2) {
    return parts.slice(-2).join('.')
  }
  return hostname
}

export function supportsBusinessSubdomains() {
  const root = getRootDomain()
  return Boolean(root) && root !== '127.0.0.1' && !/^\d+\.\d+\.\d+\.\d+$/.test(root)
}

export function getBusinessSubdomain() {
  const hostname = getHostname()
  const root = getRootDomain()

  if (!hostname || !root || hostname === root) return null
  if (!hostname.endsWith(`.${root}`)) return null

  const sub = hostname.slice(0, -(root.length + 1))
  if (!sub || sub.includes('.') || RESERVED_SUBDOMAINS.has(sub)) return null
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(sub)) return null

  return sub
}

export function getApexOrigin() {
  const { protocol, port } = window.location
  const root = getRootDomain()
  const portPart = port ? `:${port}` : ''
  return `${protocol}//${root}${portPart}`
}

export function buildBusinessPublicUrl(slug) {
  const cleanSlug = String(slug || '')
    .trim()
    .toLowerCase()
  if (!cleanSlug) return null

  if (!supportsBusinessSubdomains()) {
    return `${window.location.origin}/b/${cleanSlug}`
  }

  const { protocol, port } = window.location
  const root = getRootDomain()
  const portPart = port ? `:${port}` : ''
  return `${protocol}//${cleanSlug}.${root}${portPart}`
}
