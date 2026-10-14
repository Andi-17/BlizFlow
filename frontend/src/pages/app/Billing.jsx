import { useEffect, useState } from 'react'
import Alert from '../../components/Alert'
import LoadingSpinner from '../../components/LoadingSpinner'
import PlanCards from '../../components/PlanCards'
import StripeCheckoutModal from '../../components/StripeCheckoutModal'
import { billingService } from '../../services/billingService'
import { planService } from '../../services/planService'
import { getErrorMessage, unwrapList } from '../../utils/formatters'
import { startPlanCheckout } from '../../utils/planCheckout'
import { useLocale } from '../../hooks/useLocale'
import { useCompany } from '../../hooks/useCompany'
import { useAlert } from '../../hooks/useAlert'
import { planCopy } from '../../utils/planCopy'

export default function Billing() {
  const { t } = useLocale()
  const { refreshCompany } = useCompany()
  const { success, error: showError } = useAlert()
  const [subscription, setSubscription] = useState(null)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyPlanId, setBusyPlanId] = useState(null)
  const [canceling, setCanceling] = useState(false)
  const [openingPortal, setOpeningPortal] = useState(false)
  const [checkout, setCheckout] = useState(null)
  const [checkoutPlanName, setCheckoutPlanName] = useState('')

  const load = async () => {
    const [subscriptionRes, plansRes] = await Promise.all([
      billingService.subscription(),
      planService.list(),
    ])
    setSubscription(subscriptionRes.data)
    setPlans(unwrapList(plansRes.data).items)
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        await load()
      } catch (err) {
        if (active) setError(getErrorMessage(err))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const openStripePortal = async () => {
    setOpeningPortal(true)
    setError(null)
    try {
      const response = await billingService.portal({
        return_url: `${window.location.origin}/app/billing`,
      })
      const url = response.data?.portal?.url
      if (!url) {
        throw new Error(t('pricing.portalFailed'))
      }
      window.location.assign(url)
    } catch (err) {
      setError(getErrorMessage(err, t('pricing.portalFailed')))
      showError(getErrorMessage(err, t('pricing.portalFailed')))
      setOpeningPortal(false)
    }
  }

  const selectPlan = async (plan) => {
    setBusyPlanId(plan.id)
    setError(null)
    try {
      const currentId = subscription?.plan?.id
      const hasStripe = Boolean(subscription?.stripe_subscription_id)
      const switchingPaid = hasStripe && Number(plan.price) > 0 && Number(currentId) !== Number(plan.id)

      if (switchingPaid) {
        const response = await billingService.changePlan({ plan_id: plan.id })
        setSubscription(response.data)
        await refreshCompany()
        success(response.message || t('pricing.planUpdated'))
        return
      }

      const { redirected, embedded, checkout: nextCheckout, response } = await startPlanCheckout(plan, {
        successPath: '/app/billing/success',
        cancelPath: '/app/billing',
      })

      if (redirected) return

      if (embedded && nextCheckout) {
        setCheckoutPlanName(planCopy(t, plan).name)
        setCheckout(nextCheckout)
        return
      }

      setSubscription(response.data?.subscription || response.data)
      await refreshCompany()
      success(response.message || t('pricing.planUpdated'))
    } catch (err) {
      setError(getErrorMessage(err))
      showError(getErrorMessage(err))
    } finally {
      setBusyPlanId(null)
    }
  }

  const cancelSubscription = async () => {
    setCanceling(true)
    setError(null)
    try {
      const response = await billingService.cancel({ at_period_end: true })
      setSubscription(response.data)
      await refreshCompany()
      success(response.message || t('pricing.canceled'))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setCanceling(false)
    }
  }

  const handlePaid = async (response) => {
    setCheckout(null)
    setSubscription(response.data)
    await refreshCompany()
    success(response.message || t('pricing.paymentConfirmed'))
  }

  if (loading) return <LoadingSpinner />

  const plan = subscription?.plan
  const planName = plan ? planCopy(t, plan).name : t('pricing.free.name')
  const isPaid = Number(plan?.price ?? 0) > 0

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{t('app.planTitle')}</h1>
          <p className="text-secondary mb-0">{t('pricing.billingLede')}</p>
        </div>
      </div>
      {error ? <Alert type="danger" message={error} /> : null}

      <div className="panel mb-4" style={{ maxWidth: 560 }}>
        <p className="eyebrow mb-1">{t('pricing.currentAccess')}</p>
        <p className="display-6 mb-1">{planName}</p>
        <p className="text-secondary mb-0">
          {t('pricing.status')}:{' '}
          <span className="badge badge-soft text-capitalize">{subscription?.status || 'active'}</span>
        </p>
        {isPaid && !subscription?.cancel_at ? (
          <button type="button" className="btn btn-outline-brand mt-3" disabled={canceling} onClick={cancelSubscription}>
            {canceling ? t('pricing.working') : t('pricing.cancelAtPeriodEnd')}
          </button>
        ) : null}
        <button
          type="button"
          className="btn btn-brand mt-3 ms-0 ms-sm-2"
          disabled={openingPortal}
          onClick={openStripePortal}
        >
          {openingPortal ? t('pricing.working') : t('pricing.openStripePortal')}
        </button>
        <p className="form-text mt-2 mb-0">{t('pricing.portalHelp')}</p>
      </div>

      <PlanCards
        plans={plans}
        currentPlanId={plan?.id}
        busyPlanId={busyPlanId}
        onSelect={selectPlan}
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
    </>
  )
}
