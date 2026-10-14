export function formatCurrency(amount, currency = 'EUR') {
  const value = Number(amount ?? 0)
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)
}

export function formatDate(value, options = {}) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(date)
}

export function formatDateTime(value) {
  return formatDate(value, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getErrorMessage(error, fallback = 'Something went wrong') {
  if (!error) return fallback
  const data = error.response?.data
  if (typeof data?.message === 'string' && data.message) return data.message
  if (typeof error.message === 'string' && error.message) return error.message
  return fallback
}

export function getValidationErrors(error) {
  const errors = error?.response?.data?.errors
  if (!errors || typeof errors !== 'object') return {}
  return errors
}

export function firstValidationError(errors, field) {
  const messages = errors?.[field]
  if (Array.isArray(messages) && messages.length) return messages[0]
  if (typeof messages === 'string') return messages
  return null
}

export function unwrapList(payload) {
  if (!payload) return { items: [], meta: null }
  if (Array.isArray(payload)) return { items: payload, meta: null }
  if (Array.isArray(payload.data)) {
    return {
      items: payload.data,
      meta: payload.meta ?? {
        current_page: payload.current_page,
        last_page: payload.last_page,
        per_page: payload.per_page,
        total: payload.total,
        from: payload.from,
        to: payload.to,
      },
    }
  }
  return { items: [], meta: null }
}

export function planDisplayPrice(plan) {
  if (!plan) return formatCurrency(0)
  const price = Number(plan.price ?? 0)
  if (price === 0) return 'Free'
  return formatCurrency(price, plan.currency || 'EUR')
}
