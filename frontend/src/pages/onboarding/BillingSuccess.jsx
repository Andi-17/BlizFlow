import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Alert from '../../components/Alert'
import LoadingSpinner from '../../components/LoadingSpinner'
import { billingService } from '../../services/billingService'
import { useCompany } from '../../hooks/useCompany'
import { getErrorMessage } from '../../utils/formatters'
import { useLocale } from '../../hooks/useLocale'

async function confirmWithRetry(sessionId) {
  let lastError = null
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await billingService.confirm({ session_id: sessionId })
    } catch (error) {
      lastError = error
      const message = getErrorMessage(error, '')
      const retryable = /not complete|No Stripe subscription|confirm error/i.test(message)
      if (!retryable || attempt === 4) {
        throw error
      }
      await new Promise((resolve) => {
        window.setTimeout(resolve, 700 * (attempt + 1))
      })
    }
  }
  throw lastError
}

export default function BillingSuccess() {
  const { t } = useLocale()
  const { refreshCompany } = useCompany()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState(sessionId ? 'confirming' : 'missing')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!sessionId) return

    let active = true
    ;(async () => {
      try {
        await confirmWithRetry(sessionId)
        if (!active) return
        await refreshCompany()
        setStatus('ready')
      } catch (err) {
        if (!active) return
        setError(getErrorMessage(err, t('pricing.paymentIncomplete')))
        setStatus('error')
      }
    })()

    return () => {
      active = false
    }
  }, [sessionId, refreshCompany, t])

  return (
    <div className="container py-5" style={{ maxWidth: 560 }}>
      <div className="panel text-center page-enter">
        <div className="empty-state-icon mb-3">
          <i className={status === 'ready' ? 'bi bi-check-lg' : 'bi bi-credit-card'} aria-hidden="true" />
        </div>
        {status === 'confirming' ? <LoadingSpinner /> : null}
        <h1 className="h3">
          {status === 'ready' ? t('pricing.paymentConfirmed') : t('pricing.confirmingPayment')}
        </h1>
        {error ? <Alert type="danger" message={error} /> : null}
        {status === 'missing' ? <p className="text-secondary">{t('pricing.paymentIncomplete')}</p> : null}
        {status === 'ready' ? <p className="text-secondary">{t('pricing.paymentConfirmedLede')}</p> : null}
        <Link to="/app/billing" className="btn btn-outline-brand me-2">
          {t('app.billing')}
        </Link>
        <Link to="/app" className="btn btn-brand">
          {t('common.openApp')}
        </Link>
      </div>
    </div>
  )
}
