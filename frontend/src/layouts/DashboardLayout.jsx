import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import GlobalAlerts from '../components/GlobalAlerts'
import TrialBanner from '../components/TrialBanner'
import ThemeToggle from '../components/ThemeToggle'
import LanguageSwitch from '../components/LanguageSwitch'
import { useAuth } from '../hooks/useAuth'
import { useCompany } from '../hooks/useCompany'
import { useIndustry } from '../hooks/useIndustry'
import { usePermissions } from '../hooks/usePermissions'
import { useAlert } from '../hooks/useAlert'
import { useLocale } from '../hooks/useLocale'
import { contactMessageService } from '../services/contactMessageService'

export default function DashboardLayout() {
  const { user, logout, isPlatformAdmin, isImpersonating, impersonator, stopImpersonating, refreshUser } = useAuth()
  const { companies, companyId, selectCompany, company, leaveCompany } = useCompany()
  const { label, industry, panel, slug } = useIndustry()
  const {
    isWorker,
    canManageEmployees,
    canManageBilling,
    canManageSettings,
    canViewTeamPerformance,
    roleSlug,
  } = usePermissions()
  const { success, error } = useAlert()
  const { t } = useLocale()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [stoppingImpersonation, setStoppingImpersonation] = useState(false)
  const [unreadContacts, setUnreadContacts] = useState(0)
  const navIcons = panel.navIcons || {}

  useEffect(() => {
    if (!companyId) {
      setUnreadContacts(0)
      return undefined
    }

    let active = true
    const loadUnread = async () => {
      try {
        const response = await contactMessageService.unreadCount()
        if (active) setUnreadContacts(Number(response?.data?.count || 0))
      } catch {
        if (active) setUnreadContacts(0)
      }
    }

    loadUnread()
    const timer = window.setInterval(loadUnread, 120000)
    const onChanged = () => loadUnread()
    window.addEventListener('bizflow:contacts-changed', onChanged)

    return () => {
      active = false
      window.clearInterval(timer)
      window.removeEventListener('bizflow:contacts-changed', onChanged)
    }
  }, [companyId])

  const navItems = useMemo(() => {
    const items = [
      { to: '/app', label: t('app.dashboard'), icon: 'bi-speedometer2', end: true, group: t('app.workspace') },
      { to: '/app/my-work', label: isWorker ? t('app.myWork') : t('app.performance'), icon: 'bi-bar-chart-line', group: t('app.workspace') },
      { to: '/app/customers', label: label('customers'), icon: navIcons.customers || 'bi-people', group: t('app.operations') },
      { to: '/app/products', label: label('products'), icon: navIcons.products || 'bi-box-seam', group: t('app.operations') },
      { to: '/app/inventory', label: label('inventory'), icon: navIcons.inventory || 'bi-clipboard-data', group: t('app.operations') },
      { to: '/app/orders', label: label('orders'), icon: navIcons.orders || 'bi-cart3', group: t('app.operations') },
      { to: '/app/invoices', label: label('invoices'), icon: navIcons.invoices || 'bi-receipt', group: t('app.operations') },
      { to: '/app/tasks', label: label('tasks'), icon: navIcons.tasks || 'bi-check2-square', group: t('app.operations') },
      { to: '/app/projects', label: label('projects'), icon: navIcons.projects || 'bi-kanban', group: t('app.operations') },
      { to: '/app/contacts', label: t('app.contactHistory'), icon: 'bi-envelope', group: t('app.operations') },
    ]

    if (canManageEmployees || canViewTeamPerformance) {
      items.push({
        to: '/app/employees',
        label: label('employees'),
        icon: navIcons.employees || 'bi-person-badge',
        group: t('app.team'),
      })
    }

    if (!isWorker) {
      items.push({ to: '/app/reports', label: t('app.reports'), icon: 'bi-graph-up', group: t('app.team') })
    }

    if (canManageBilling) {
      items.push({ to: '/app/billing', label: t('app.billing'), icon: 'bi-credit-card', group: t('app.account') })
    }

    items.push({ to: '/app/workspaces', label: t('app.companies'), icon: 'bi-buildings', group: t('app.account') })

    if (canManageSettings) {
      items.push({ to: '/app/settings', label: t('app.settings'), icon: 'bi-gear', group: t('app.account') })
    }

    return items
  }, [
    label,
    navIcons,
    isWorker,
    canManageEmployees,
    canViewTeamPerformance,
    canManageBilling,
    canManageSettings,
    t,
  ])

  const handleLeaveCompany = () => {
    leaveCompany()
    success(t('app.leftCompany'))
    navigate('/app/workspaces')
  }

  const handleLogout = async () => {
    try {
      await logout()
      success(t('app.signedOut'))
      navigate('/')
    } catch (err) {
      error(err?.response?.data?.message || t('app.logoutFail'))
    }
  }

  const handleStopImpersonating = async () => {
    setStoppingImpersonation(true)
    try {
      const response = await stopImpersonating()
      await refreshUser()
      if (response.data?.company_id) {
        await selectCompany(response.data.company_id)
      }
      success('Back to your admin account')
      navigate('/app/employees')
    } catch (err) {
      error(err?.response?.data?.message || 'Could not return to admin')
    } finally {
      setStoppingImpersonation(false)
    }
  }

  return (
    <div
      className="app-shell"
      data-industry={slug}
      style={{
        '--industry-accent': panel.accent,
        '--industry-soft': panel.soft,
      }}
    >
      <GlobalAlerts />
      <TrialBanner />
      {sidebarOpen ? <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} /> : null}
      <aside className={`app-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="sidebar-brand">
            <NavLink to="/app" className="brand-mark" onClick={() => setSidebarOpen(false)}>
            {company?.logo_url ? (
              <span className="brand-mark__glyph">
                <img src={company.logo_url} alt="" className="brand-mark__logo" />
              </span>
            ) : null}
            <span className="sidebar-brand__text">
              <strong>{company?.name || 'BizFlow'}</strong>
              <small>{industry.name}</small>
            </span>
          </NavLink>
          <button
            type="button"
            className="btn btn-sm btn-outline-brand d-lg-none"
            onClick={() => setSidebarOpen(false)}
            aria-label={t('app.closeMenu')}
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="role-chip mb-3">{roleSlug || 'member'}</div>
        <nav className="sidebar-nav">
          {[t('app.workspace'), t('app.operations'), t('app.team'), t('app.account')].map((groupName) => {
            const groupItems = navItems.filter((item) => item.group === groupName)
            if (!groupItems.length) return null
            return (
              <div className="sidebar-group" key={groupName}>
                <p className="sidebar-group__label">{groupName}</p>
                {groupItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <i className={`bi ${item.icon}`} aria-hidden="true" />
                    <span className="nav-link__label">{item.label}</span>
                    {item.to === '/app/contacts' && unreadContacts > 0 ? (
                      <span className="nav-link__badge">{unreadContacts > 9 ? '9+' : unreadContacts}</span>
                    ) : null}
                  </NavLink>
                ))}
              </div>
            )
          })}
          {isPlatformAdmin ? (
            <div className="sidebar-group">
              <p className="sidebar-group__label">{t('app.platform')}</p>
              <NavLink to="/admin" className="nav-link" onClick={() => setSidebarOpen(false)}>
                <i className="bi bi-shield-lock" aria-hidden="true" />
                {t('app.platformAdmin')}
              </NavLink>
            </div>
          ) : null}
        </nav>
        <div className="sidebar-user">
          <span className="sidebar-user__avatar" aria-hidden="true">
            {(user?.name || 'U').slice(0, 1).toUpperCase()}
          </span>
          <span>
            <strong>{user?.name || t('app.account')}</strong>
            <small>{user?.email}</small>
          </span>
        </div>
      </aside>

      <div className="app-main">
        {isImpersonating ? (
          <div className="impersonation-banner">
            <span>
              {t('app.viewingAs')} <strong>{user?.name}</strong>
              {impersonator?.name ? ` · Admin: ${impersonator.name}` : ''}
            </span>
            <button type="button" className="btn btn-sm btn-brand" disabled={stoppingImpersonation} onClick={handleStopImpersonating}>
              {stoppingImpersonation ? t('app.returning') : t('app.returnAdmin')}
            </button>
          </div>
        ) : null}
        <header className="app-topbar">
          <div className="d-flex align-items-center gap-3">
            <button
              type="button"
              className="btn btn-outline-brand sidebar-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label={t('app.openMenu')}
            >
              <i className="bi bi-list" />
            </button>
            <div>
              <div className="small text-secondary">{t('app.workspace')}</div>
              <strong>{company?.name || t('app.selectCompany')}</strong>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
            <select
              className="form-select form-select-sm company-switcher"
              value={companyId || ''}
              onChange={(event) => {
                const value = event.target.value
                if (!value) {
                  handleLeaveCompany()
                  return
                }
                selectCompany(value)
              }}
              aria-label={t('app.switchCompany')}
            >
              <option value="">{t('app.leaveChoose')}</option>
              {companies.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-sm btn-outline-brand" onClick={handleLeaveCompany} title={t('app.leave')}>
              {t('app.leave')}
            </button>
            <LanguageSwitch />
            <ThemeToggle />
            <button type="button" className="btn btn-sm btn-outline-brand" onClick={handleLogout}>
              {t('common.logOut')}
            </button>
          </div>
        </header>
        <div className="app-content page-enter">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
