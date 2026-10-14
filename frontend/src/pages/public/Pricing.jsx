import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PlanCards from '../../components/PlanCards'
import { useAuth } from '../../hooks/useAuth'
import { useLocale } from '../../hooks/useLocale'
import { planService } from '../../services/planService'
import { unwrapList } from '../../utils/formatters'

const fallbackPlans = [
  { id: 'free', slug: 'free', price: 0, currency: 'eur', interval: 'lifetime', is_featured: false },
  { id: 'pro', slug: 'pro', price: 19, currency: 'eur', interval: 'monthly', is_featured: true },
  { id: 'business', slug: 'business', price: 40, currency: 'eur', interval: 'monthly', is_featured: false },
]

export default function Pricing() {
  const { isAuthenticated } = useAuth()
  const { t } = useLocale()
  const navigate = useNavigate()
  const [plans, setPlans] = useState(fallbackPlans)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const response = await planService.list()
        const items = unwrapList(response.data).items
        if (active && items.length) setPlans(items)
      } catch {
        // keep marketing fallback
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const handleSelect = () => {
    navigate(isAuthenticated ? '/app/billing' : '/register')
  }

  return (
    <>
      <section className="page-hero page-hero--luxe">
        <div className="container page-hero__inner">
          <p className="eyebrow">{t('pricing.kicker')}</p>
          <h1>{t('pricing.title')}</h1>
          <p className="page-hero__lede">{t('pricing.lede')}</p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <PlanCards
            plans={plans}
            onSelect={handleSelect}
            ctaLabel={() => (isAuthenticated ? t('pricing.manage') : t('pricing.create'))}
          />
        </div>
      </section>
    </>
  )
}
