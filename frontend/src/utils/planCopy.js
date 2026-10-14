export function planFamily(slug) {
  const value = String(slug || '')
  if (value.includes('business')) return 'business'
  if (value.includes('pro')) return 'pro'
  if (value === 'free' || value.includes('free')) return 'free'
  return 'custom'
}

export function planCopy(t, plan) {
  const family = planFamily(plan?.slug)
  if (family === 'custom') {
    const features = Array.isArray(plan?.features) ? plan.features : []
    return {
      name: plan?.name || 'Plan',
      lede: plan?.description || '',
      items: features.filter((item) => typeof item === 'string'),
    }
  }

  const items = [1, 2, 3, 4, 5, 6]
    .map((index) => t(`pricing.${family}.f${index}`))
    .filter((item) => item && !item.startsWith('pricing.'))

  return {
    name: t(`pricing.${family}.name`),
    lede: t(`pricing.${family}.lede`),
    items,
  }
}

export function planIntervalLabel(t, interval) {
  if (interval === 'yearly') return t('pricing.perYear')
  if (interval === 'monthly') return t('pricing.perMonth')
  return t('pricing.oneTime')
}
