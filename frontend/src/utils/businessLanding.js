const SERVICE_ICON_RULES = [
  { match: /oil|filter|lubr/i, icon: 'bi-droplet' },
  { match: /brake|fren/i, icon: 'bi-disc' },
  { match: /diagnos|inspect/i, icon: 'bi-clipboard2-pulse' },
  { match: /body|paint|karro/i, icon: 'bi-car-front' },
  { match: /hair|cut|berber|salon/i, icon: 'bi-scissors' },
  { match: /beard|groom/i, icon: 'bi-person-bounding-box' },
  { match: /color|ngjyr/i, icon: 'bi-palette' },
  { match: /retail|product|shop/i, icon: 'bi-bag' },
  { match: /emerg|urgent/i, icon: 'bi-exclamation-triangle' },
  { match: /install|montim/i, icon: 'bi-tools' },
  { match: /mainten|mirëmbajt/i, icon: 'bi-gear' },
  { match: /material|part|stok/i, icon: 'bi-box-seam' },
  { match: /light|ndriç/i, icon: 'bi-lightbulb' },
  { match: /panel|elektr/i, icon: 'bi-lightning-charge' },
  { match: /menu|food|kitchen|restoran/i, icon: 'bi-cup-hot' },
  { match: /clean|pastrim/i, icon: 'bi-sparkles' },
  { match: /build|construct|ndërt/i, icon: 'bi-bricks' },
  { match: /clinic|health|mjek/i, icon: 'bi-heart-pulse' },
  { match: /fit|gym|sport/i, icon: 'bi-activity' },
  { match: /consult|advice/i, icon: 'bi-chat-square-text' },
  { match: /photo|foto/i, icon: 'bi-camera' },
  { match: /beauty|makeup|kozmet/i, icon: 'bi-stars' },
  { match: /garden|land|peizazh/i, icon: 'bi-tree' },
  { match: /pet|kafsh/i, icon: 'bi-heart' },
  { match: /bakery|bukë|bread/i, icon: 'bi-basket2' },
  { match: /wood|carpenter|dru/i, icon: 'bi-hammer' },
  { match: /tailor|rroba/i, icon: 'bi-scissors' },
  { match: /pharma|farmac/i, icon: 'bi-capsule' },
]

const INDUSTRY_DEFAULT_ICON = {
  general: 'bi-building',
  barber: 'bi-scissors',
  mechanic: 'bi-wrench-adjustable',
  plumber: 'bi-droplet-half',
  electrician: 'bi-lightning-charge',
  restaurant: 'bi-cup-hot',
  cleaning: 'bi-sparkles',
  construction: 'bi-bricks',
  clinic: 'bi-heart-pulse',
  fitness: 'bi-activity',
  consulting: 'bi-briefcase',
  retail: 'bi-shop',
  bakery: 'bi-basket2',
  carpenter: 'bi-hammer',
  tailor: 'bi-scissors',
  pharmacy: 'bi-capsule',
  photography: 'bi-camera',
  beauty: 'bi-stars',
  landscaping: 'bi-tree',
  pet: 'bi-heart',
}

export function getIndustryIcon(industrySlug, fallbackIcon) {
  if (fallbackIcon && String(fallbackIcon).startsWith('bi-')) return fallbackIcon
  return INDUSTRY_DEFAULT_ICON[industrySlug] || 'bi-building'
}

export function getServiceIcon(serviceName, industrySlug) {
  const name = String(serviceName || '')
  for (const rule of SERVICE_ICON_RULES) {
    if (rule.match.test(name)) return rule.icon
  }
  return getIndustryIcon(industrySlug)
}

export function buildPhoneHref(phone) {
  if (!phone) return null
  return `tel:${String(phone).replace(/[^\d+]/g, '')}`
}

export function buildEmailHref(email) {
  if (!email) return null
  return `mailto:${email}`
}

export function buildMapHref(addressLabel) {
  if (!addressLabel) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLabel)}`
}

const DAY_ALIASES = {
  0: ['sun', 'sunday', 'die', 'diel', 'so', 'sonntag'],
  1: ['mon', 'monday', 'hën', 'hene', 'hen', 'mo', 'montag'],
  2: ['tue', 'tues', 'tuesday', 'mar', 'marte', 'di', 'dienstag'],
  3: ['wed', 'wednesday', 'mer', 'merkure', 'mi', 'mittwoch'],
  4: ['thu', 'thur', 'thurs', 'thursday', 'enj', 'enjte', 'do', 'donnerstag'],
  5: ['fri', 'friday', 'pre', 'premte', 'fr', 'freitag'],
  6: ['sat', 'saturday', 'sht', 'shtun', 'sa', 'samstag'],
}

const WEEKDAY_RANGE = {
  'mon-fri': [1, 2, 3, 4, 5],
  'mon-sat': [1, 2, 3, 4, 5, 6],
  'mon-sun': [0, 1, 2, 3, 4, 5, 6],
  'hën-pre': [1, 2, 3, 4, 5],
  'hen-pre': [1, 2, 3, 4, 5],
  'hene-premte': [1, 2, 3, 4, 5],
  'mo-fr': [1, 2, 3, 4, 5],
  'mo-sa': [1, 2, 3, 4, 5, 6],
}

function parseHourMinute(raw) {
  const match = String(raw).trim().match(/^(\d{1,2})(?::(\d{2}))?(?:\s*(am|pm))?$/i)
  if (!match) return null
  let hour = Number(match[1])
  const minute = Number(match[2] || 0)
  const meridiem = (match[3] || '').toLowerCase()
  if (meridiem === 'pm' && hour < 12) hour += 12
  if (meridiem === 'am' && hour === 12) hour = 0
  if (hour > 23 || minute > 59) return null
  return hour * 60 + minute
}

function extractTimeRange(text) {
  const match = String(text).match(
    /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[-–—]\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
  )
  if (!match) return null
  const start = parseHourMinute(match[1])
  const end = parseHourMinute(match[2])
  if (start == null || end == null || start === end) return null
  return { start, end }
}

function lineMatchesDay(line, dayIndex) {
  const normalized = line
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  for (const [key, days] of Object.entries(WEEKDAY_RANGE)) {
    if (normalized.includes(key) && days.includes(dayIndex)) return true
  }
  return (DAY_ALIASES[dayIndex] || []).some((alias) => {
    const pattern = new RegExp(`(^|[^a-z])${alias}([^a-z]|$)`, 'i')
    return pattern.test(normalized)
  })
}

/**
 * Best-effort open/closed from free-text hours.
 * Returns 'open' | 'closed' | null when unknown.
 */
export function getOpenNowStatus(openingHours, now = new Date()) {
  if (!openingHours || !String(openingHours).trim()) return null
  const dayIndex = now.getDay()
  const minutesNow = now.getHours() * 60 + now.getMinutes()
  const chunks = String(openingHours)
    .split(/\n|;|\|/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)

  const dayLines = chunks.filter((chunk) => lineMatchesDay(chunk, dayIndex))
  const candidates = dayLines.length ? dayLines : chunks.length === 1 ? chunks : []
  if (!candidates.length) return null

  let sawRange = false
  for (const line of candidates) {
    if (/closed|mbyllur|geschlossen/i.test(line) && !extractTimeRange(line)) {
      return 'closed'
    }
    const range = extractTimeRange(line)
    if (!range) continue
    sawRange = true
    const wrapsMidnight = range.end < range.start
    if (wrapsMidnight) {
      if (minutesNow >= range.start || minutesNow < range.end) return 'open'
    } else if (minutesNow >= range.start && minutesNow < range.end) {
      return 'open'
    }
  }
  return sawRange ? 'closed' : null
}

/** Short “today” line from free-text hours, when a day match exists. */
export function getTodayHoursLabel(openingHours, now = new Date()) {
  if (!openingHours || !String(openingHours).trim()) return null
  const dayIndex = now.getDay()
  const chunks = String(openingHours)
    .split(/\n|;|\|/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
  const dayLine = chunks.find((chunk) => lineMatchesDay(chunk, dayIndex))
  if (!dayLine) return null
  const range = extractTimeRange(dayLine)
  if (range) {
    const format = (totalMinutes) => {
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }
    return `${format(range.start)}–${format(range.end)}`
  }
  if (/closed|mbyllur|geschlossen/i.test(dayLine)) return null
  return dayLine.length > 42 ? `${dayLine.slice(0, 40)}…` : dayLine
}

export function buildFactItems(company, t) {
  const items = []
  if (company.industry_name) {
    items.push({
      key: 'industry',
      icon: getIndustryIcon(company.industry, company.industry_icon),
      label: t('business.industry'),
      value: company.industry_name,
    })
  }
  if (company.phone) {
    items.push({
      key: 'phone',
      icon: 'bi-telephone',
      label: t('business.phone'),
      value: company.phone,
      href: buildPhoneHref(company.phone),
    })
  }
  if (company.email) {
    items.push({
      key: 'email',
      icon: 'bi-envelope',
      label: t('business.email'),
      value: company.email,
      href: buildEmailHref(company.email),
    })
  }
  if (company.address_label) {
    items.push({
      key: 'address',
      icon: 'bi-geo-alt',
      label: t('business.address'),
      value: company.address_label,
      href: buildMapHref(company.address_label),
    })
  }
  if (company.opening_hours) {
    const openStatus = getOpenNowStatus(company.opening_hours)
    items.push({
      key: 'hours',
      icon: 'bi-clock',
      label: t('business.hours'),
      value: company.opening_hours,
      openStatus,
      openLabel:
        openStatus === 'open'
          ? t('business.openNow')
          : openStatus === 'closed'
            ? t('business.closedNow')
            : null,
    })
  }
  return items
}

/**
 * Facts-based "why engage" points — only from real available data, no fake claims.
 */
export function buildEngagementPoints(company, t) {
  const points = []
  if (Array.isArray(company.services) && company.services.length > 0) {
    points.push({
      key: 'services',
      icon: 'bi-grid',
      title: t('business.pointServicesTitle'),
      text: t('business.pointServicesText', { count: String(company.services.length) }),
    })
  }
  if (company.phone) {
    points.push({
      key: 'phone',
      icon: 'bi-telephone-outbound',
      title: t('business.pointPhoneTitle'),
      text: t('business.pointPhoneText'),
    })
  }
  if (company.email) {
    points.push({
      key: 'email',
      icon: 'bi-envelope-check',
      title: t('business.pointEmailTitle'),
      text: t('business.pointEmailText'),
    })
  }
  if (company.address_label) {
    points.push({
      key: 'local',
      icon: 'bi-geo',
      title: t('business.pointLocalTitle'),
      text: t('business.pointLocalText'),
    })
  }
  return points
}

export function getPrimaryCta(company, canContact, t) {
  if (canContact) {
    return { href: '#contact', label: t('business.requestQuote'), kind: 'contact' }
  }
  if (company.phone) {
    return { href: buildPhoneHref(company.phone), label: t('business.callNow'), kind: 'phone' }
  }
  if (company.email) {
    return { href: buildEmailHref(company.email), label: t('business.emailUs'), kind: 'email' }
  }
  if (company.address_label) {
    return { href: '#location', label: t('business.visitUs'), kind: 'visit' }
  }
  return null
}
