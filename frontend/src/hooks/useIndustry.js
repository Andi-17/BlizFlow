import { useMemo } from 'react'
import { useCompany } from './useCompany'
import { labelFor, resolveIndustry } from '../utils/industry'
import { getIndustryPanel } from '../utils/industryPanels'

export function useIndustry() {
  const { company } = useCompany()

  return useMemo(() => {
    const meta = resolveIndustry(company)
    const slug = meta.slug || 'general'
    return {
      industry: meta,
      slug,
      panel: getIndustryPanel(slug),
      label: (key, fallback) => labelFor(company, key, fallback),
      company,
    }
  }, [company])
}
