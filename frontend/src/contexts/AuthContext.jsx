import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/authService'
import { setCompanyHeader } from '../services/api'
import { getErrorMessage } from '../utils/formatters'

const AuthContext = createContext(null)

function clearPersistedCompany() {
  localStorage.removeItem('bizflow_company_id')
  localStorage.removeItem('bizflow_company_user')
  sessionStorage.removeItem('bizflow_left_workspace')
  setCompanyHeader(null)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [memberships, setMemberships] = useState([])
  const [impersonator, setImpersonator] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bootError, setBootError] = useState(null)

  const applySession = useCallback((payload) => {
    const nextUser = payload?.user ?? payload ?? null
    setUser(nextUser)
    if (Array.isArray(payload?.memberships)) {
      setMemberships(payload.memberships)
    }
    if ('impersonator' in (payload || {}) || 'impersonating' in (payload || {})) {
      setImpersonator(payload?.impersonating ? payload.impersonator : null)
    }
    return nextUser
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.me()
      const nextUser = response.data?.user ?? null
      setUser(nextUser)
      setMemberships(response.data?.memberships ?? [])
      setImpersonator(response.data?.impersonating ? response.data.impersonator : null)
      setBootError(null)
      return {
        user: nextUser,
        memberships: response.data?.memberships ?? [],
        companies: nextUser?.companies ?? [],
        impersonator: response.data?.impersonating ? response.data.impersonator : null,
        company_id: response.data?.company_id,
      }
    } catch (error) {
      setUser(null)
      setMemberships([])
      setImpersonator(null)
      if (error.response?.status !== 401) {
        setBootError(getErrorMessage(error, 'Unable to load session'))
      }
      return { user: null, memberships: [], companies: [], impersonator: null }
    }
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        await refreshUser()
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [refreshUser])

  const login = useCallback(async (credentials) => {
    const response = await authService.login(credentials)
    return response
  }, [])

  const requestLoginCode = login

  const confirmLogin = useCallback(async (payload) => {
    const response = await authService.confirmLogin(payload)
    applySession({ user: response.data?.user, memberships: [], impersonating: false, impersonator: null })
    const session = await refreshUser()
    return { ...response, session }
  }, [applySession, refreshUser])

  const register = useCallback(async (payload) => {
    const response = await authService.register(payload)
    return response
  }, [])

  const requestRegistrationCode = register

  const confirmRegistration = useCallback(async (payload) => {
    const response = await authService.confirmRegistration(payload)
    applySession({ user: response.data?.user, memberships: [], impersonating: false, impersonator: null })
    const session = await refreshUser()
    return { ...response, session }
  }, [applySession, refreshUser])

  const deleteAccount = useCallback(async (payload) => {
    const response = await authService.deleteAccount(payload)
    setUser(null)
    setMemberships([])
    setImpersonator(null)
    clearPersistedCompany()
    return response
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      setUser(null)
      setMemberships([])
      setImpersonator(null)
      clearPersistedCompany()
    }
  }, [])

  const stopImpersonating = useCallback(async () => {
    const response = await authService.stopImpersonating()
    applySession({
      user: response.data?.user,
      memberships: response.data?.memberships ?? [],
      impersonating: false,
      impersonator: null,
    })
    await refreshUser()
    return response
  }, [applySession, refreshUser])

  const companiesFromSession = useMemo(() => {
    if (user?.companies?.length) return user.companies
    return []
  }, [user])

  const value = useMemo(
    () => ({
      user,
      memberships,
      impersonator,
      isImpersonating: Boolean(impersonator),
      loading,
      bootError,
      isAuthenticated: Boolean(user),
      isPlatformAdmin: Boolean(user?.is_platform_admin),
      isPlatformOwner: Boolean(user?.is_platform_owner),
      companies: companiesFromSession,
      login,
      requestLoginCode,
      confirmLogin,
      register,
      requestRegistrationCode,
      confirmRegistration,
      deleteAccount,
      logout,
      stopImpersonating,
      refreshUser,
      applySession,
      setUser,
    }),
    [
      user,
      memberships,
      impersonator,
      loading,
      bootError,
      companiesFromSession,
      login,
      requestLoginCode,
      confirmLogin,
      register,
      requestRegistrationCode,
      confirmRegistration,
      deleteAccount,
      logout,
      stopImpersonating,
      refreshUser,
      applySession,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
