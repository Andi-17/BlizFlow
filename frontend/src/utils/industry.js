export const INDUSTRY_FALLBACK = {
  slug: 'general',
  name: 'General business',
  icon: 'bi-building',
  description: 'Retail, wholesale, or any custom operation',
  labels: {
    customers: 'Customers',
    products: 'Products',
    inventory: 'Inventory',
    orders: 'Orders',
    invoices: 'Invoices',
    employees: 'Employees',
    projects: 'Projects',
    tasks: 'Tasks',
  },
}

export function resolveIndustry(company) {
  if (company?.industry_meta?.labels) return company.industry_meta
  return INDUSTRY_FALLBACK
}

export function labelFor(company, key, fallback) {
  const industry = resolveIndustry(company)
  return industry.labels?.[key] || fallback || INDUSTRY_FALLBACK.labels[key] || key
}

export function featureList(plan) {
  if (!plan?.features) return []
  if (Array.isArray(plan.features)) {
    return plan.features.map((feature) => {
      if (typeof feature === 'string') return feature
      if (feature && typeof feature === 'object') {
        return Object.entries(feature)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')
      }
      return String(feature)
    })
  }
  if (typeof plan.features === 'object') {
    return Object.entries(plan.features).map(([key, value]) => `${key}: ${value}`)
  }
  return []
}

export function monthlyPlansOnly(plans = []) {
  return [...plans]
    .filter((plan) => Number(plan.price) === 0 || plan.interval === 'monthly' || plan.interval === 'lifetime')
    .filter((plan) => plan.is_active !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || Number(a.price) - Number(b.price))
}
