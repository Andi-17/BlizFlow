import { NavLink, Outlet } from 'react-router-dom'
import GlobalAlerts from '../components/GlobalAlerts'
import ThemeToggle from '../components/ThemeToggle'
import LanguageSwitch from '../components/LanguageSwitch'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../hooks/useLocale'

export default function PublicLayout() {
  const { isAuthenticated, isPlatformAdmin } = useAuth()
  const { t } = useLocale()
  const year = new Date().getFullYear()
  const navLinks = [
    { to: '/features', label: t('nav.features') },
    { to: '/pricing', label: t('nav.pricing') },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
  ]

  return (
    <div className="public-shell">
      <GlobalAlerts />
      <nav className="public-nav">
        <div className="container public-nav__bar">
          <NavLink to="/" className="brand-mark">
            <span className="brand-mark__glyph">
              <i className="bi bi-layers-half" aria-hidden="true" />
            </span>
            BizFlow
          </NavLink>

          <div className="public-nav__links d-none d-md-flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `public-nav__link${isActive ? ' is-active' : ''}`}
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="public-nav__actions">
            <LanguageSwitch />
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                {isPlatformAdmin ? (
                  <NavLink to="/admin" className="btn btn-sm btn-outline-brand">
                    {t('common.admin')}
                  </NavLink>
                ) : null}
                <NavLink to="/app" className="btn btn-sm btn-brand">
                  {t('common.openApp')}
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/login" className="btn btn-sm btn-outline-brand">
                  {t('common.logIn')}
                </NavLink>
                <NavLink to="/register" className="btn btn-sm btn-brand">
                  {t('common.startFree')}
                </NavLink>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow-1 page-enter">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="site-footer__grid">
            <div className="site-footer__brand">
              <NavLink to="/" className="brand-mark">
                <span className="brand-mark__glyph">
                  <i className="bi bi-layers-half" aria-hidden="true" />
                </span>
                BizFlow
              </NavLink>
              <p>{t('footer.blurb')}</p>
            </div>
            <div>
              <h2>{t('footer.product')}</h2>
              <ul>
                <li>
                  <NavLink to="/features">{t('nav.features')}</NavLink>
                </li>
                <li>
                  <NavLink to="/pricing">{t('nav.pricing')}</NavLink>
                </li>
                <li>
                  <NavLink to="/about">{t('nav.about')}</NavLink>
                </li>
                <li>
                  <NavLink to="/contact">{t('nav.contact')}</NavLink>
                </li>
              </ul>
            </div>
            <div>
              <h2>{t('footer.getStarted')}</h2>
              <ul>
                <li>
                  <NavLink to="/register">{t('footer.createAccount')}</NavLink>
                </li>
                <li>
                  <NavLink to="/login">{t('common.signIn')}</NavLink>
                </li>
              </ul>
              <div className="store-badges">
                <span className="store-badge">{t('footer.appStore')}</span>
                <span className="store-badge">{t('footer.playStore')}</span>
              </div>
            </div>
          </div>
          <div className="site-footer__bottom">
            <span>{t('footer.rights', { year })}</span>
            <span>{t('footer.tagline')}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
