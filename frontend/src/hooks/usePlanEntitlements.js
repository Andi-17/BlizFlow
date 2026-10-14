import { useMemo } from 'react'
import { useCompany } from './useCompany'
import { planFamily } from '../utils/planCopy'

export function usePlanEntitlements() {
  const { company } = useCompany()
  const subscription = company?.subscription || null
  const plan = subscription?.plan || null

  return useMemo(() => {
    const family = planFamily(plan?.slug)
    const price = Number(plan?.price ?? 0)
    const hasVerifiedPayment = Boolean(subscription?.stripe_subscription_id)
    const periodEnd = subscription?.current_period_end ? new Date(subscription.current_period_end) : null
    const isWithinPaidPeriod = !periodEnd || periodEnd.getTime() > Date.now()
    const status = String(subscription?.status || 'active')
    const statusOk = ['active', 'trialing', 'past_due'].includes(status)
    const trialEndsAt = subscription?.trial_ends_at ? new Date(subscription.trial_ends_at) : null
    const isTrialing =
      Boolean(subscription?.is_trialing) ||
      (status === 'trialing' &&
        subscription?.provider === 'trial' &&
        trialEndsAt &&
        trialEndsAt.getTime() > Date.now())
    const trialExpired = Boolean(subscription?.trial_expired)
    const trialDaysLeft =
      subscription?.trial_days_left != null
        ? Number(subscription.trial_days_left)
        : isTrialing && trialEndsAt
          ? Math.max(1, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000))
          : null

    const isEntitledPaid =
      (price > 0 && hasVerifiedPayment && statusOk && isWithinPaidPeriod) || isTrialing
    const entitledPlanFamily = isEntitledPaid ? family : 'free'
    const limits = isEntitledPaid
      ? plan?.limits || {}
      : { max_companies: 1, max_users: 3, reports: false }
    const maxUsers = Number(limits.max_users ?? 3)
    const maxCompanies = Number(limits.max_companies ?? 1)

    return {
      plan,
      family: entitledPlanFamily,
      maxCompanies,
      maxUsers,
      unlimitedUsers: maxUsers === 0,
      unlimitedCompanies: maxCompanies === 0,
      canViewReports: Boolean(limits.reports),
      isPaid: isEntitledPaid && !isTrialing,
      isTrialing,
      trialExpired,
      trialDaysLeft,
      trialEndsAt: trialEndsAt ? trialEndsAt.toISOString() : null,
      isFree: !isEntitledPaid,
    }
  }, [plan, subscription])
}
