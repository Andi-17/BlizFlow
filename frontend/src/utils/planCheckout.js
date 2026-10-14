import { billingService } from '../services/billingService'

export async function startPlanCheckout(plan, { successPath = '/app/billing/success', cancelPath = '/app/billing' } = {}) {
  const origin = window.location.origin
  const response = await billingService.checkout({
    plan_id: plan.id,
    success_url: `${origin}${successPath}`,
    cancel_url: `${origin}${cancelPath}`,
  })

  if (response.data?.mode === 'checkout' && response.data?.checkout?.client_secret) {
    return {
      redirected: false,
      embedded: true,
      checkout: response.data.checkout,
      response,
    }
  }

  // Legacy hosted Checkout fallback
  if (response.data?.mode === 'checkout' && response.data?.checkout?.url) {
    window.location.assign(response.data.checkout.url)
    return { redirected: true, embedded: false, response }
  }

  if (Number(plan.price) > 0) {
    const message = response.message || 'Payment is required for this plan.'
    throw new Error(message)
  }

  return { redirected: false, embedded: false, response }
}
