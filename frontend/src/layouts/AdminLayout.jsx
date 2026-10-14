import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import GlobalAlerts from '../components/GlobalAlerts'
import ThemeToggle from '../components/ThemeToggle'
import LanguageSwitch from '../components/LanguageSwitch'
import { useAuth } from '../hooks/useAuth'
import { useAlert } from '../hooks/useAlert'
import { useLocale } from '../hooks/useLocale'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const { success } = useAlert()
  const { t } = useLocale()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const adminNav = [
    { to: '/admin', label: t('admin.overview'), icon: 'bi-speedometer2', end: true },
    { to: '/admin/users', label: t('admin.users'), icon: 'bi-people' },
    { to: '/admin/companies', label: t('admin.companies'), icon: 'bi-buildings' },
    { to: '/admin/subscriptions', label: t('admin.subscriptions'), icon: 'bi-credit-card' },
    { to: '/admin/payments', label: t('admin.payments'), icon: 'bi-cash-stack' },
    { to: '/admin/billing-invoices', label: t('admin.invoices'), icon: 'bi-receipt' },
    { to: '/admin/plans', label: t('admin.plans'), icon: 'bi-tags' },
    { to: '/admin/activity', label: t('admin.activity'), icon: 'bi-activity' },
    { to: '/admin/messages', label: t('admin.messages'), icon: 'bi-envelope' },
  ]

  const handleLogout = async () => {
    await logout()
    success(t('app.signedOut'))
    navigate('/')
  }

  return (
    <div className="app-shell">
      <GlobalAlerts />
      {sidebarOpen ? <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} /> : null}
      <aside className={`app-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="mb-4 px-1">
          <div className="brand-mark mb-2">
            <span className="brand-mark__glyph">
              <i className="bi bi-shield-lock-fill" aria-hidden="true" />
            </span>
            BizFlow Admin
          </div>
          <p className="small text-secondary mb-0 px-1">{t('admin.control')}</p>
        </div>
        <nav className="nav flex-column">
          {adminNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <i className={`bi ${item.icon} me-2`} aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
          <NavLink to="/app" className="nav-link mt-3" onClick={() => setSidebarOpen(false)}>
            <i className="bi bi-arrow-left me-2" aria-hidden="true" />
            {t('admin.backToApp')}
          </NavLink>
        </nav>
      </aside>
      <div className="app-main">
        <header className="app-topbar">
          <button
            type="button"
            className="btn btn-outline-brand sidebar-toggle"
            onClick={() => setSidebarOpen(true)}
          >
            <i className="bi bi-list" />
          </button>
          <strong>{t('admin.heading')}</strong>
          <div className="d-flex align-items-center gap-2">
            <LanguageSwitch />
            <ThemeToggle />
            <span className="small text-secondary">{user?.email}</span>
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
