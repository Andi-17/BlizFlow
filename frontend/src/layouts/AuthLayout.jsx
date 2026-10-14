import { Link, Outlet, useLocation } from 'react-router-dom'
import GlobalAlerts from '../components/GlobalAlerts'
import ThemeToggle from '../components/ThemeToggle'
import LanguageSwitch from '../components/LanguageSwitch'
import { useLocale } from '../hooks/useLocale'

export default function AuthLayout() {
  const location = useLocation()
  const isRegister = location.pathname.includes('register')
  const { t } = useLocale()

  return (
    <div className={`auth-shell${isRegister ? ' auth-shell--signup' : ''}`}>
      <div className="auth-shell__glow" aria-hidden="true" />
      <div className="auth-shell__glow auth-shell__glow--soft" aria-hidden="true" />
      <GlobalAlerts />
      <div className={`auth-card page-enter ${isRegister ? 'auth-card--wide auth-card--signup' : ''}`}>
        <div className="auth-card__top">
          <Link to="/" className="brand-mark mb-0">
            <span className="brand-mark__glyph">
              <i className="bi bi-hexagon-fill" aria-hidden="true" />
            </span>
            BizFlow
          </Link>
          <div className="d-flex align-items-center gap-2">
            <LanguageSwitch />
            <ThemeToggle />
            <Link to="/" className="auth-close" aria-label={t('auth.backHome')} title={t('auth.backHome')}>
              <i className="bi bi-x-lg" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <Outlet />
        <div className="auth-card__footer">
          <Link to="/">← {t('auth.backHome')}</Link>
        </div>
      </div>
    </div>
  )
}
