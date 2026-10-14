import { useMemo, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import Alert from './Alert'
import LoadingSpinner from './LoadingSpinner'
import { billingService } from '../services/billingService'
import { formatCurrency, getErrorMessage } from '../utils/formatters'
import { useLocale } from '../hooks/useLocale'
import { planIntervalLabel } from '../utils/planCopy'

function CheckoutPayForm({
  sessionId,
  planName,
  amount,
  currency,
  interval,
  onClose,
  onPaid,
}) {
  const { t } = useLocale()
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const priceLabel = formatCurrency(amount, (currency || 'eur').toUpperCase())
  const intervalLabel = planIntervalLabel(t, interval)

  const confirmOnServer = async () => {
    let lastError = null
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await billingService.confirm({ session_id: sessionId })
      } catch (err) {
        lastError = err
        const message = getErrorMessage(err, '')
        const retryable = /not complete|No Stripe subscription|confirm error/i.test(message)
        if (!retryable || attempt === 4) throw err
        await new Promise((resolve) => {
          window.setTimeout(resolve, 700 * (attempt + 1))
        })
      }
    }
    throw lastError
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!stripe || !elements || submitting) return

    setSubmitting(true)
    setError(null)

    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/app/billing/success?session_id=${encodeURIComponent(sessionId)}`,
        },
      })

      if (result.error) {
        throw new Error(result.error.message || t('pricing.paymentIncomplete'))
      }

      const response = await confirmOnServer()
      onPaid?.(response)
    } catch (err) {
      setError(getErrorMessage(err, t('pricing.paymentIncomplete')))
      setSubmitting(false)
    }
  }

  return (
    <form className="checkout-form" onSubmit={handleSubmit}>
      <div className="checkout-form__summary">
        <p className="eyebrow mb-1">{t('pricing.secureCheckout')}</p>
        <h2 className="h4 mb-1">{planName}</h2>
        <p className="checkout-form__price mb-0">
          {priceLabel}
          {intervalLabel ? <span className="text-secondary"> {intervalLabel}</span> : null}
        </p>
      </div>

      <div className="checkout-form__fields">
        <PaymentElement
          options={{
            layout: 'tabs',
            business: { name: 'BizFlow' },
          }}
        />
      </div>

      {error ? <Alert type="danger" message={error} /> : null}

      <div className="checkout-form__actions">
        <button type="button" className="btn btn-outline-brand" onClick={onClose} disabled={submitting}>
          {t('common.close')}
        </button>
        <button type="submit" className="btn btn-brand" disabled={!stripe || !elements || submitting}>
          {submitting ? t('pricing.working') : t('pricing.payNow', { amount: priceLabel })}
        </button>
      </div>
    </form>
  )
}

export default function StripeCheckoutModal({
  open,
  planName,
  clientSecret,
  publishableKey,
  sessionId,
  amount,
  currency,
  interval,
  onClose,
  onPaid,
}) {
  const { t } = useLocale()

  const stripePromise = useMemo(() => {
    if (!publishableKey) return null
    return loadStripe(publishableKey)
  }, [publishableKey])

  const elementsOptions = useMemo(() => {
    if (!clientSecret) return null
    return {
      clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#1F6F50',
          colorBackground: '#ffffff',
          colorText: '#0b0f0d',
          colorDanger: '#c44b4b',
          fontFamily: 'Sora, system-ui, sans-serif',
          borderRadius: '10px',
        },
      },
    }
  }, [clientSecret])

  if (!open) return null

  return (
    <div className="checkout-modal" role="dialog" aria-modal="true" aria-label={t('pricing.payInApp')}>
      <button type="button" className="checkout-modal__backdrop" aria-label={t('common.close')} onClick={onClose} />
      <div className="checkout-modal__panel checkout-modal__panel--react">
        {!clientSecret || !stripePromise || !elementsOptions ? (
          <div className="py-4">
            <LoadingSpinner label={t('pricing.working')} />
          </div>
        ) : (
          <Elements stripe={stripePromise} options={elementsOptions}>
            <CheckoutPayForm
              sessionId={sessionId}
              planName={planName}
              amount={amount}
              currency={currency}
              interval={interval}
              onClose={onClose}
              onPaid={onPaid}
            />
          </Elements>
        )}
      </div>
    </div>
  )
}
