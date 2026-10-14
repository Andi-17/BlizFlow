import { formatCurrency } from '../utils/formatters'
import { planCopy, planFamily, planIntervalLabel } from '../utils/planCopy'
import { useLocale } from '../hooks/useLocale'

export default function PlanCards({
  plans,
  currentPlanId = null,
  busyPlanId = null,
  onSelect,
  ctaLabel,
}) {
  const { t } = useLocale()

  return (
    <div className="pricing-grid">
      {plans.map((plan) => {
        const family = planFamily(plan.slug)
        const copy = planCopy(t, plan)
        const isCurrent = currentPlanId != null && Number(currentPlanId) === Number(plan.id)
        const isBusy = busyPlanId != null && Number(busyPlanId) === Number(plan.id)
        const priceNumber = Number(plan.price ?? 0)
        const priceLabel = priceNumber <= 0 ? t('pricing.freePrice') : formatCurrency(priceNumber, (plan.currency || 'eur').toUpperCase())
        const buttonLabel = isCurrent
          ? t('pricing.current')
          : ctaLabel
            ? ctaLabel(plan, family)
            : t('pricing.choose', { name: copy.name })

        return (
          <article
            key={plan.id || plan.slug}
            className={`pricing-card ${plan.is_featured || family === 'pro' ? 'is-featured' : ''} ${isCurrent ? 'is-current' : ''}`}
          >
            {plan.is_featured || family === 'pro' ? (
              <p className="pricing-card__badge">{t('pricing.mostPopular')}</p>
            ) : null}
            <p className="eyebrow mb-2">{copy.name}</p>
            <p className="pricing-price">
              {priceLabel}
              {priceNumber > 0 ? <span className="pricing-price__interval">{planIntervalLabel(t, plan.interval)}</span> : null}
            </p>
            <p className="text-secondary mb-3">{copy.lede}</p>
            <ul className="pricing-features">
              {copy.items.map((item) => (
                <li key={item}>
                  <i className="bi bi-check2" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            {onSelect ? (
              <button
                type="button"
                className={family === 'pro' ? 'btn btn-brand w-100 mt-auto' : 'btn btn-outline-brand w-100 mt-auto'}
                disabled={isCurrent || isBusy}
                onClick={() => onSelect(plan)}
              >
                {isBusy ? t('pricing.working') : buttonLabel}
              </button>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}
