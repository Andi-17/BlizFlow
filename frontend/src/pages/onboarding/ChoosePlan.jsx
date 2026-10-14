import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alert from '../../components/Alert'
import LoadingSpinner from '../../components/LoadingSpinner'
import PlanCards from '../../components/PlanCards'
import StripeCheckoutModal from '../../components/StripeCheckoutModal'
import { planService } from '../../services/planService'
import { useCompany } from '../../hooks/useCompany'
import { useAlert } from '../../hooks/useAlert'
import { useLocale } from '../../hooks/useLocale'
import { getErrorMessage, unwrapList } from '../../utils/formatters'
import { startPlanCheckout } from '../../utils/planCheckout'
import { planCopy, planFamily } from '../../utils/planCopy'

export default function ChoosePlan() {
  const navigate = useNavigate()
  const { hasCompany, refreshCompany } = useCompany()
  const { success, error: showError } = useAlert()
  const { t } = useLocale()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyPlanId, setBusyPlanId] = useState(null)
  const [checkout, setCheckout] = useState(null)
  const [checkoutPlanName, setCheckoutPlanName] = useState('')

  useEffect(() => {
    if (!hasCompany) {
      navigate('/onboarding/company', { replace: true })
      return
    }

    let active = true
    ;(async () => {
      try {
        const plansRes = await planService.list()
        const items = unwrapList(plansRes.data).items
        if (active) setPlans(items)
      } catch (err) {
        if (active) setError(getErrorMessage(err))
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [hasCompany, navigate])

  const selectPlan = async (plan) => {
    setBusyPlanId(plan.id)
    setError(null)
    try {
      const { redirected, embedded, checkout: nextCheckout, response } = await startPlanCheckout(plan, {
        successPath: '/app/billing/success',
        cancelPath: '/onboarding/plan',
      })
      if (redirected) return

      if (embedded && nextCheckout) {
        setCheckoutPlanName(planCopy(t, plan).name)
        setCheckout(nextCheckout)
        return
      }

      await refreshCompany()
      success(response.message || t('pricing.workspaceReady'))
      navigate('/app', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
      showError(getErrorMessage(err))
    } finally {
      setBusyPlanId(null)
    }
  }

  const handlePaid = async (response) => {
    setCheckout(null)
    await refreshCompany()
    success(response.message || t('pricing.paymentConfirmed'))
    navigate('/app', { replace: true })
  }

  if (loading) return <LoadingSpinner fullPage label={t('pricing.loadingPlans')} />

  return (
    <div className="container py-5">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t('pricing.kicker')}</p>
          <h1>{t('pricing.chooseTitle')}</h1>
          <p className="text-secondary mb-0">{t('pricing.chooseLede')}</p>
        </div>
      </div>
      {error ? <Alert type="danger" message={error} /> : null}
      <PlanCards
        plans={plans}
        busyPlanId={busyPlanId}
        onSelect={selectPlan}
        ctaLabel={(plan) => {
          const family = planFamily(plan.slug)
          if (family === 'free') return t('pricing.continueFree')
          return t('pricing.choose', { name: planCopy(t, plan).name })
        }}
      />

      <StripeCheckoutModal
        open={Boolean(checkout)}
        planName={checkoutPlanName}
        clientSecret={checkout?.client_secret}
        publishableKey={checkout?.publishable_key}
        sessionId={checkout?.id}
        amount={checkout?.amount}
        currency={checkout?.currency}
        interval={checkout?.interval}
        onClose={() => setCheckout(null)}
        onPaid={handlePaid}
      />
    </div>
  )
}
