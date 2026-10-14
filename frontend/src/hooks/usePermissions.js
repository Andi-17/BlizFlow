import { useMemo } from 'react'
import { useAuth } from './useAuth'
import { useCompany } from './useCompany'

export function usePermissions() {
  const { memberships, isPlatformAdmin } = useAuth()
  const { companyId } = useCompany()

  return useMemo(() => {
    const membership = memberships.find((item) => String(item.company_id) === String(companyId))
    const roleSlug = membership?.role?.slug || (membership?.is_owner ? 'owner' : null)
    const permissions = new Set(membership?.role?.permissions || [])

    const can = (permission) => {
      if (isPlatformAdmin) return true
      if (!membership) return false
      if (membership.is_owner) return true
      if (['owner', 'admin'].includes(roleSlug)) return true
      return permissions.has(permission)
    }

    const isWorker = roleSlug === 'employee'
    const isManager = roleSlug === 'manager'
    const isAdmin = ['owner', 'admin'].includes(roleSlug) || Boolean(membership?.is_owner)

    return {
      membership,
      roleSlug,
      permissions,
      can,
      isWorker,
      isManager,
      isAdmin,
      canManageEmployees: can('employees.manage'),
      canViewTeamPerformance: can('performance.team'),
      canManageBilling: can('billing.manage'),
      canManageSettings: can('settings.manage'),
      canManageOrders: can('orders.manage'),
      canManageCustomers: can('customers.manage'),
    }
  }, [memberships, companyId, isPlatformAdmin])
}
