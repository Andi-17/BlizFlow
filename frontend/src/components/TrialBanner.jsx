import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlanEntitlements } from '../hooks/usePlanEntitlements'
import { useLocale } from '../hooks/useLocale'
import { useCompany } from '../hooks/useCompany'

const DISMISS_KEY = 'bizflow_trial_offer_dismissed'

export default function TrialBanner() {
  const { t } = useLocale()
  const { company, companyId } = useCompany()
  const { isTrialing, isPaid } = usePlanEntitlements()
  const [showOffer, setShowOffer] = useState(false)
  const trialEndedPending = String(company?.settings_map?.trial_ended_pending || '') === '1'

  useEffect(() => {
    if (!companyId || isPaid || isTrialing || !trialEndedPending) {
      setShowOffer(false)
      return
    }
    const dismissed = sessionStorage.getItem(`${DISMISS_KEY}:${companyId}`)
    setShowOffer(!dismissed)
  }, [companyId, isPaid, isTrialing, trialEndedPending])

  if (!showOffer) return null

  const dismissOffer = () => {
    if (companyId) sessionStorage.setItem(`${DISMISS_KEY}:${companyId}`, '1')
    setShowOffer(false)
  }

  return (
    <div className="trial-banner trial-banner--ended" role="dialog" aria-label={t('pricing.trialEndedTitle')}>
      <div className="trial-banner__inner">
        <i className="bi bi-hourglass-split" aria-hidden="true" />
        <div className="trial-banner__copy">
          <strong>{t('pricing.trialEndedTitle')}</strong>
          <p className="mb-0">{t('pricing.trialEndedLede')}</p>
        </div>
        <div className="trial-banner__actions">
          <Link to="/app/billing" className="btn btn-sm btn-brand" onClick={dismissOffer}>
            {t('pricing.upgradeNow')}
          </Link>
          <button type="button" className="btn btn-sm btn-outline-brand" onClick={dismissOffer}>
            {t('pricing.stayOnFree')}
          </button>
        </div>
      </div>
    </div>
  )
}
