import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { setCompanyHeader } from '../services/api'
import { companyService } from '../services/companyService'
import { unwrapList } from '../utils/formatters'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../hooks/useLocale'

const CompanyContext = createContext(null)
const STORAGE_KEY = 'bizflow_company_id'
const USER_STORAGE_KEY = 'bizflow_company_user'
const LEFT_KEY = 'bizflow_left_workspace'

function readStoredCompanyId(userId) {
  if (!userId) return null
  const savedUser = localStorage.getItem(USER_STORAGE_KEY)
  const savedCompany = localStorage.getItem(STORAGE_KEY)
  if (savedUser && String(savedUser) === String(userId) && savedCompany) {
    return savedCompany
  }
  return null
}

function persistCompanySelection(userId, companyId) {
  if (companyId && userId) {
    localStorage.setItem(STORAGE_KEY, String(companyId))
    localStorage.setItem(USER_STORAGE_KEY, String(userId))
    setCompanyHeader(companyId)
  } else {
    localStorage.removeItem(STORAGE_KEY)
    setCompanyHeader(null)
    if (userId) {
      localStorage.setItem(USER_STORAGE_KEY, String(userId))
    } else {
      localStorage.removeItem(USER_STORAGE_KEY)
    }
  }
}

export function CompanyProvider({ children }) {
  const { user, isAuthenticated, memberships, refreshUser } = useAuth()
  const { setLocale } = useLocale()
  const [companies, setCompanies] = useState([])
  const [company, setCompany] = useState(null)
  const [companyId, setCompanyIdState] = useState(null)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  const applySelection = useCallback((id, companyList = [], userId = user?.id) => {
    const nextId = id ? String(id) : null
    setCompanyIdState(nextId)
    persistCompanySelection(userId, nextId)
    if (nextId && companyList.length) {
      const selected = companyList.find((item) => String(item.id) === String(nextId))
      setCompany(selected ?? null)
    } else if (!nextId) {
      setCompany(null)
    }
  }, [user?.id])

  const clearSession = useCallback(() => {
    setCompanies([])
    setCompany(null)
    setCompanyIdState(null)
    persistCompanySelection(null, null)
    sessionStorage.removeItem(LEFT_KEY)
  }, [])

  const loadCompanies = useCallback(async ({ autoSelect = true } = {}) => {
    if (!isAuthenticated || !user?.id) {
      clearSession()
      setReady(true)
      return []
    }

    setLoading(true)
    setReady(false)
    try {
      const response = await companyService.list({ per_page: 100 })
      const { items } = unwrapList(response.data)
      const fromMemberships = (memberships || [])
        .filter((membership) => membership.status !== 'inactive')
        .map((membership) => ({ id: membership.company_id }))

      let list = items
      if (!list.length && user.companies?.length) {
        list = user.companies
      }
      if (!list.length && fromMemberships.length) {
        list = fromMemberships
      }

      setCompanies(list)

      const preferredId = readStoredCompanyId(user.id)
      const leftWorkspace = sessionStorage.getItem(LEFT_KEY) === '1'
      const shouldAuto = autoSelect && !leftWorkspace

      if (preferredId && list.some((item) => String(item.id) === String(preferredId))) {
        applySelection(preferredId, list, user.id)
      } else if (shouldAuto && list[0]) {
        applySelection(list[0].id, list, user.id)
      } else {
        applySelection(null, list, user.id)
      }

      return list
    } catch {
      const fallback = user?.companies ?? []
      setCompanies(fallback)
      if (fallback[0] && sessionStorage.getItem(LEFT_KEY) !== '1') {
        applySelection(fallback[0].id, fallback, user.id)
      } else {
        applySelection(null, fallback, user.id)
      }
      return fallback
    } finally {
      setLoading(false)
      setReady(true)
    }
  }, [isAuthenticated, user, memberships, applySelection, clearSession])

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      clearSession()
      setLoading(false)
      setReady(true)
      return
    }

    setReady(false)
    setLoading(true)
    loadCompanies()
  }, [isAuthenticated, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!companyId || !isAuthenticated || !ready) return
    let active = true
    ;(async () => {
      try {
        const response = await companyService.current()
        if (active && response.data) {
          setCompany(response.data)
          const locale = response.data.locale || response.data.settings_map?.locale
          if (locale) setLocale(locale)
        }
      } catch {
        // keep list selection
      }
    })()
    return () => {
      active = false
    }
  }, [companyId, isAuthenticated, ready, setLocale])

  const switchCompany = useCallback(
    async (id) => {
      sessionStorage.removeItem(LEFT_KEY)
      applySelection(id, companies, user?.id)
      try {
        const response = await companyService.current()
        setCompany(response.data ?? companies.find((item) => String(item.id) === String(id)) ?? null)
      } catch {
        const selected = companies.find((item) => String(item.id) === String(id))
        setCompany(selected ?? null)
      }
    },
    [companies, applySelection, user?.id],
  )

  const leaveCompany = useCallback(() => {
    sessionStorage.setItem(LEFT_KEY, '1')
    applySelection(null, companies, user?.id)
    setCompany(null)
  }, [applySelection, companies, user?.id])

  const refreshCompany = useCallback(async () => {
    await refreshUser()
    return loadCompanies({ autoSelect: false })
  }, [loadCompanies, refreshUser])

  const hasMembership = Boolean(
    companies.length
    || (user?.companies && user.companies.length)
    || (memberships && memberships.length),
  )

  const value = useMemo(
    () => ({
      companies,
      company,
      companyId,
      loading,
      ready,
      hasCompany: Boolean(companyId) && hasMembership,
      hasMembership,
      selectCompany: switchCompany,
      leaveCompany,
      loadCompanies,
      refreshCompany,
      clearSession,
      setCompany,
    }),
    [
      companies,
      company,
      companyId,
      loading,
      ready,
      hasMembership,
      switchCompany,
      leaveCompany,
      loadCompanies,
      refreshCompany,
      clearSession,
    ],
  )

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
}

export default CompanyContext
