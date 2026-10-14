import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Alert from '../../components/Alert'
import BusinessContactForm from '../../components/BusinessContactForm'
import LanguageSwitch from '../../components/LanguageSwitch'
import LoadingSpinner from '../../components/LoadingSpinner'
import Reveal from '../../components/Reveal'
import ThemeToggle from '../../components/ThemeToggle'
import { useLocale } from '../../hooks/useLocale'
import { useAuth } from '../../hooks/useAuth'
import { publicCompanyService } from '../../services/publicCompanyService'
import { getErrorMessage } from '../../utils/formatters'
import { getApexOrigin, getBusinessSubdomain } from '../../utils/tenantHost'
import {
  buildEmailHref,
  buildEngagementPoints,
  buildFactItems,
  buildMapHref,
  buildPhoneHref,
  getIndustryIcon,
  getOpenNowStatus,
  getPrimaryCta,
  getServiceIcon,
  getTodayHoursLabel,
} from '../../utils/businessLanding'
import { getLandingMotif, getLandingTheme, getLandingThemeStyle } from '../../utils/landingTheme'

function BrandMark({ company, size = 'md' }) {
  if (company.logo_url) {
    return (
      <img
        className={`bl-brand-logo bl-brand-logo--${size}`}
        src={company.logo_url}
        alt={company.name}
      />
    )
  }

  const initial = String(company.name || '?').trim().charAt(0).toUpperCase()
  return (
    <span className={`bl-brand-mark bl-brand-mark--${size}`} aria-hidden="true">
      {initial}
    </span>
  )
}

export default function CompanyLanding({ slugOverride = null }) {
  const { slug: routeSlug } = useParams()
  const slug = slugOverride || routeSlug
  const { t } = useLocale()
  const { isAuthenticated } = useAuth()

  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      setError(t('business.notFound'))
      return undefined
    }

    let active = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await publicCompanyService.show(slug)
        if (active) setCompany(response.data)
      } catch (err) {
        if (active) {
          setCompany(null)
          setError(getErrorMessage(err, t('business.notFound')))
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [slug, t])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const services = useMemo(
    () => (Array.isArray(company?.services) ? company.services.filter(Boolean) : []),
    [company],
  )
  const highlights = useMemo(
    () => (Array.isArray(company?.landing_page?.highlights) ? company.landing_page.highlights.filter((row) => row?.name) : []),
    [company],
  )
  const highlightsTitle = company?.landing_page?.highlights_title || t('business.navHighlights')
  const canContact = Boolean(company?.has_contact_email || company?.email)
  const phoneHref = buildPhoneHref(company?.phone)
  const emailHref = buildEmailHref(company?.email)
  const mapHref = company?.landing_page?.google_maps_url || buildMapHref(company?.address_label)
  const mapEmbed = company?.landing_page?.google_maps_embed || null
  const factItems = useMemo(() => (company ? buildFactItems(company, t) : []), [company, t])
  const openNowStatus = useMemo(
    () => (company?.opening_hours ? getOpenNowStatus(company.opening_hours) : null),
    [company],
  )
  const todayHours = useMemo(
    () => (company?.opening_hours ? getTodayHoursLabel(company.opening_hours) : null),
    [company],
  )
  const engagementPoints = useMemo(
    () => (company ? buildEngagementPoints(company, t) : []),
    [company, t],
  )
  const primaryCta = useMemo(
    () => (company ? getPrimaryCta(company, canContact, t) : null),
    [company, canContact, t],
  )

  const industrySlug = company?.industry || 'general'
  const industryIcon = getIndustryIcon(industrySlug, company?.industry_icon)
  const landingTheme = getLandingTheme(industrySlug)
  const landingLayout = landingTheme.layout
  const landingMotifs = getLandingMotif(industrySlug)
  const landingThemeStyle = getLandingThemeStyle(industrySlug)
  const aboutText = company?.tagline || company?.industry_description || null
  const hasAbout = Boolean(aboutText)
  const hasLocation = Boolean(company?.address_label || mapHref || mapEmbed)
  const hasInfo = factItems.length > 0
  const showVisitorDock = Boolean(phoneHref || canContact || mapHref)
  const homeHref = getApexOrigin()
  const onSubdomain = Boolean(getBusinessSubdomain())
  const dashboardHref = onSubdomain ? `${homeHref}/app` : '/app'

  const navItems = useMemo(() => {
    if (!company) return []
    const items = []
    if (hasAbout) items.push({ id: 'about', label: t('business.navAbout') })
    if (services.length > 0) items.push({ id: 'services', label: t('business.navServices') })
    if (highlights.length > 0) items.push({ id: 'highlights', label: t('business.navHighlights') })
    if (engagementPoints.length > 0) items.push({ id: 'why', label: t('business.navWhy') })
    if (hasInfo) items.push({ id: 'info', label: t('business.navInfo') })
    if (hasLocation) items.push({ id: 'location', label: t('business.navLocation') })
    if (canContact) items.push({ id: 'contact', label: t('business.navContact') })
    return items
  }, [
    company,
    hasAbout,
    services.length,
    highlights.length,
    engagementPoints.length,
    hasInfo,
    hasLocation,
    canContact,
    t,
  ])

  const closeMenu = () => setMenuOpen(false)

  const scrollToSection = (sectionId) => {
    closeMenu()
    const target = document.getElementById(sectionId)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (loading) {
    return (
      <div className="bl-shell bl-shell--state" data-industry="general">
        <LoadingSpinner fullPage label={t('common.loading')} />
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className="bl-shell bl-shell--state" data-industry="general">
        <div className="bl-empty">
          <Alert type="danger" message={error || t('business.notFound')} />
          {onSubdomain ? (
            <a className="btn bl-btn-primary mt-3" href={homeHref}>
              {t('business.backHome')}
            </a>
          ) : (
            <Link className="btn bl-btn-primary mt-3" to="/">
              {t('business.backHome')}
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`bl-shell${showVisitorDock ? ' bl-shell--dock' : ''}`}
      data-industry={industrySlug}
      data-layout={landingLayout}
      data-hero={landingTheme.hero}
      data-title={landingTheme.title}
      style={landingThemeStyle}
    >      <div className="bl-atmosphere" aria-hidden="true" />

      <header className={`bl-nav ${scrolled ? 'is-scrolled' : ''} ${menuOpen ? 'is-open' : ''}`}>
        <div className="bl-nav-inner">
          <a
            className="bl-nav-brand"
            href="#top"
            onClick={(event) => {
              event.preventDefault()
              closeMenu()
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            <BrandMark company={company} size="sm" />
            <span className="bl-nav-brand-text">{company.name}</span>
          </a>

          <nav className="bl-nav-links" aria-label={t('business.navLabel')}>
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="bl-nav-link"
                onClick={() => scrollToSection(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="bl-nav-actions">
            {isAuthenticated ? (
              onSubdomain ? (
                <a className="btn bl-btn-ghost bl-nav-dashboard" href={dashboardHref}>
                  <i className="bi bi-speedometer2" aria-hidden="true" />
                  <span>{t('business.backToDashboard')}</span>
                </a>
              ) : (
                <Link className="btn bl-btn-ghost bl-nav-dashboard" to="/app">
                  <i className="bi bi-speedometer2" aria-hidden="true" />
                  <span>{t('business.backToDashboard')}</span>
                </Link>
              )
            ) : null}
            <LanguageSwitch />
            <ThemeToggle />
            {primaryCta ? (
              primaryCta.kind === 'contact' || primaryCta.kind === 'visit' ? (
                <button
                  type="button"
                  className="btn bl-btn-primary bl-nav-cta"
                  onClick={() => scrollToSection(primaryCta.kind === 'visit' ? 'location' : 'contact')}
                >
                  {primaryCta.label}
                </button>
              ) : (
                <a className="btn bl-btn-primary bl-nav-cta" href={primaryCta.href}>
                  {primaryCta.label}
                </a>
              )
            ) : null}
            <button
              type="button"
              className="bl-nav-toggle"
              aria-expanded={menuOpen}
              aria-controls="bl-mobile-menu"
              aria-label={menuOpen ? t('business.closeMenu') : t('business.openMenu')}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <i className={`bi ${menuOpen ? 'bi-x-lg' : 'bi-list'}`} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          id="bl-mobile-menu"
          className={`bl-mobile-menu ${menuOpen ? 'is-open' : ''}`}
          hidden={!menuOpen}
        >
          <div className="bl-mobile-menu-inner">
            {isAuthenticated ? (
              onSubdomain ? (
                <a className="btn bl-btn-ghost w-100 mb-2" href={dashboardHref} onClick={closeMenu}>
                  <i className="bi bi-speedometer2" aria-hidden="true" /> {t('business.backToDashboard')}
                </a>
              ) : (
                <Link className="btn bl-btn-ghost w-100 mb-2" to="/app" onClick={closeMenu}>
                  <i className="bi bi-speedometer2" aria-hidden="true" /> {t('business.backToDashboard')}
                </Link>
              )
            ) : null}
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="bl-mobile-link"
                onClick={() => scrollToSection(item.id)}
              >
                {item.label}
              </button>
            ))}
            {primaryCta ? (
              primaryCta.kind === 'contact' || primaryCta.kind === 'visit' ? (
                <button
                  type="button"
                  className="btn bl-btn-primary w-100 mt-2"
                  onClick={() =>
                    scrollToSection(primaryCta.kind === 'visit' ? 'location' : 'contact')
                  }
                >
                  {primaryCta.label}
                </button>
              ) : (
                <a className="btn bl-btn-primary w-100 mt-2" href={primaryCta.href} onClick={closeMenu}>
                  {primaryCta.label}
                </a>
              )
            ) : null}
          </div>
        </div>
      </header>

      <main id="top">
        <section className="bl-hero">
          <div className="bl-hero-stage" aria-hidden="true">
            <span className="bl-hero-orb bl-hero-orb--a" />
            <span className="bl-hero-orb bl-hero-orb--b" />
            <span className="bl-hero-grain" />
          </div>

          <div className="bl-hero-grid">
            <div className="bl-hero-copy">
              {company.industry_name ? (
                <p className="bl-hero-eyebrow">
                  <i className={`bi ${industryIcon}`} aria-hidden="true" />
                  <span>{company.industry_name}</span>
                </p>
              ) : null}

              <h1 className="bl-hero-title">{company.name}</h1>
              <span className="bl-hero-rule" aria-hidden="true" />

              {aboutText ? <p className="bl-hero-lede">{aboutText}</p> : null}

              <div className="bl-hero-actions">
                {canContact ? (
                  <button
                    type="button"
                    className="btn bl-btn-primary bl-btn-lg"
                    onClick={() => scrollToSection('contact')}
                  >
                    <i className="bi bi-chat-dots" aria-hidden="true" />
                    {t('business.getInTouch')}
                  </button>
                ) : null}
                {phoneHref ? (
                  <a className="btn bl-btn-secondary bl-btn-lg" href={phoneHref}>
                    <i className="bi bi-telephone" aria-hidden="true" />
                    {t('business.callNow')}
                  </a>
                ) : null}
                {!canContact && !phoneHref && emailHref ? (
                  <a className="btn bl-btn-primary bl-btn-lg" href={emailHref}>
                    <i className="bi bi-envelope" aria-hidden="true" />
                    {t('business.emailUs')}
                  </a>
                ) : null}
                {mapHref ? (
                  <a
                    className="btn bl-btn-ghost bl-btn-lg"
                    href={mapHref}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <i className="bi bi-geo-alt" aria-hidden="true" />
                    {t('business.directions')}
                  </a>
                ) : null}
              </div>

              {openNowStatus ? (
                <p className={`bl-hero-status bl-open-badge bl-open-badge--${openNowStatus}`}>
                  <i className="bi bi-circle-fill" aria-hidden="true" />
                  <span>
                    {openNowStatus === 'open' ? t('business.openNow') : t('business.closedNow')}
                    {todayHours ? ` · ${todayHours}` : ''}
                  </span>
                </p>
              ) : todayHours ? (
                <p className="bl-hero-status bl-open-badge bl-open-badge--hours">
                  <i className="bi bi-clock" aria-hidden="true" />
                  <span>
                    {t('business.todayHours')}: {todayHours}
                  </span>
                </p>
              ) : null}
            </div>

            <div className="bl-hero-visual">
              <div className="bl-hero-panel">
                <div className="bl-hero-panel-glow" aria-hidden="true" />
                <div className="bl-hero-motif" aria-hidden="true">
                  {landingMotifs.map((motifIcon) => (
                    <span key={motifIcon}>
                      <i className={`bi ${motifIcon}`} />
                    </span>
                  ))}
                </div>
                {company.logo_url ? (
                  <img className="bl-hero-logo" src={company.logo_url} alt={company.name} />
                ) : (
                  <div className="bl-hero-wordmark">
                    <span className="bl-hero-wordmark-kicker">
                      {company.industry_name || t('business.businessLabel')}
                    </span>
                    <span className="bl-hero-wordmark-name">{company.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {services.length > 0 ? (
          <div className="bl-ribbon" aria-hidden="true">
            <div className="bl-ribbon-track">
              {[...services, ...services].map((serviceName, index) => (
                <span key={`${serviceName}-${index}`} className="bl-ribbon-item">
                  {serviceName}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {factItems.length > 0 ? (
          <section className="bl-trust" aria-label={t('business.trustLabel')}>
            <div className="bl-trust-track">
              {factItems.map((item) =>
                item.href ? (
                  <a
                    key={item.key}
                    className="bl-trust-item"
                    href={item.href}
                    {...(item.key === 'address' ? { target: '_blank', rel: 'noreferrer' } : {})}
                  >
                    <i className={`bi ${item.icon}`} aria-hidden="true" />
                    <span>
                      <small>{item.label}</small>
                      <strong>{item.value}</strong>
                    </span>
                  </a>
                ) : (
                  <div key={item.key} className="bl-trust-item">
                    <i className={`bi ${item.icon}`} aria-hidden="true" />
                    <span>
                      <small>{item.label}</small>
                      <strong>{item.value}</strong>
                    </span>
                  </div>
                ),
              )}
            </div>
          </section>
        ) : null}

        {hasAbout ? (
          <Reveal as="section" id="about" className="bl-section bl-about">
            <div className="bl-section-head">
              <span className="bl-section-index" aria-hidden="true">01</span>
              <p className="bl-kicker">{t('business.aboutKicker')}</p>
              <h2 className="bl-section-title">{t('business.aboutTitle')}</h2>
            </div>
            <div className="bl-about-body">
              <p className="bl-about-text">{aboutText}</p>
              {company.industry_name ? (
                <div className="bl-about-aside">
                  <i className={`bi ${industryIcon}`} aria-hidden="true" />
                  <div>
                    <small>{t('business.industry')}</small>
                    <strong>{company.industry_name}</strong>
                  </div>
                </div>
              ) : null}
            </div>
          </Reveal>
        ) : null}

        {services.length > 0 ? (
          <Reveal as="section" id="services" className="bl-section bl-services">
            <div className="bl-section-head">
              <span className="bl-section-index" aria-hidden="true">02</span>
              <p className="bl-kicker">{t('business.servicesKicker')}</p>
              <h2 className="bl-section-title">{t('business.servicesTitle')}</h2>
              <p className="bl-section-lede">{t('business.servicesLede')}</p>
            </div>
            <div className="bl-services-grid">
              {services.map((serviceName, index) => (
                <article
                  key={serviceName}
                  className="bl-service-card"
                  style={{ '--bl-delay': `${Math.min(index, 8) * 40}ms` }}
                >
                  <span className="bl-service-num" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="bl-service-icon">
                    <i
                      className={`bi ${getServiceIcon(serviceName, industrySlug)}`}
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="bl-service-title">{serviceName}</h3>
                </article>
              ))}
            </div>
          </Reveal>
        ) : null}

        {highlights.length > 0 ? (
          <Reveal as="section" id="highlights" className="bl-section bl-highlights">
            <div className="bl-section-head">
              <span className="bl-section-index" aria-hidden="true">03</span>
              <p className="bl-kicker">{t('business.navHighlights')}</p>
              <h2 className="bl-section-title">{highlightsTitle}</h2>
            </div>
            <div className="bl-highlights-grid">
              {highlights.map((item, index) => (
                <article
                  key={`${item.name}-${index}`}
                  className="bl-highlight-card"
                  style={{ '--bl-delay': `${Math.min(index, 8) * 40}ms` }}
                >
                  <div className="bl-highlight-top">
                    <h3 className="bl-highlight-title">{item.name}</h3>
                    {item.price ? <span className="bl-highlight-price">{item.price}</span> : null}
                  </div>
                  {item.description ? <p className="bl-highlight-desc">{item.description}</p> : null}
                </article>
              ))}
            </div>
          </Reveal>
        ) : null}

        {engagementPoints.length > 0 ? (
          <Reveal as="section" id="why" className="bl-section bl-why">
            <div className="bl-section-head">
              <span className="bl-section-index" aria-hidden="true">04</span>
              <p className="bl-kicker">{t('business.whyKicker')}</p>
              <h2 className="bl-section-title">{t('business.whyTitle')}</h2>
            </div>
            <div className="bl-why-grid">
              {engagementPoints.map((point) => (
                <article key={point.key} className="bl-why-card">
                  <div className="bl-why-icon">
                    <i className={`bi ${point.icon}`} aria-hidden="true" />
                  </div>
                  <h3>{point.title}</h3>
                  <p>{point.text}</p>
                </article>
              ))}
            </div>
          </Reveal>
        ) : null}

        {hasInfo ? (
          <Reveal as="section" id="info" className="bl-section bl-info">
            <div className="bl-section-head">
              <span className="bl-section-index" aria-hidden="true">05</span>
              <p className="bl-kicker">{t('business.infoKicker')}</p>
              <h2 className="bl-section-title">{t('business.infoTitle')}</h2>
            </div>
            <div className="bl-info-grid">
              {factItems.map((item) => (
                <div key={item.key} className="bl-info-card">
                  <div className="bl-info-icon">
                    <i className={`bi ${item.icon}`} aria-hidden="true" />
                  </div>
                  <div className="bl-info-body">
                    <small>{item.label}</small>
                    {item.href ? (
                      <a
                        href={item.href}
                        {...(item.key === 'address' ? { target: '_blank', rel: 'noreferrer' } : {})}
                      >
                        {item.value}
                      </a>
                    ) : (
                      <strong className={item.key === 'hours' ? 'bl-hours-text' : undefined}>
                        {item.value}
                      </strong>
                    )}
                    {item.openLabel ? (
                      <span className={`bl-open-badge bl-open-badge--${item.openStatus}`}>
                        {item.openLabel}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        ) : null}

        {hasLocation ? (
          <Reveal as="section" id="location" className="bl-section bl-location">
            <div className="bl-location-panel">
              <div className="bl-location-copy">
                <span className="bl-section-index" aria-hidden="true">06</span>
                <p className="bl-kicker">{t('business.locationKicker')}</p>
                <h2 className="bl-section-title">{t('business.locationTitle')}</h2>
                {company.address_label ? (
                  <p className="bl-location-address">{company.address_label}</p>
                ) : null}
                {mapHref ? (
                  <a className="btn bl-btn-primary" href={mapHref} target="_blank" rel="noreferrer">
                    <i className="bi bi-map" aria-hidden="true" />
                    {t('business.openMap')}
                  </a>
                ) : null}
              </div>
              {mapEmbed ? (
                <div className="bl-location-map">
                  <iframe
                    title={t('business.locationTitle')}
                    src={mapEmbed}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="bl-location-visual" aria-hidden="true">
                  <div className="bl-location-pin">
                    <i className="bi bi-geo-alt-fill" />
                  </div>
                </div>
              )}
            </div>
          </Reveal>
        ) : null}

        {canContact ? (
          <Reveal as="section" id="contact" className="bl-section bl-contact">
            <div className="bl-contact-shell">
              <div className="bl-contact-intro">
                <span className="bl-section-index" aria-hidden="true">07</span>
                <p className="bl-kicker">{t('business.contactKicker')}</p>
                <h2 className="bl-section-title">{t('business.getInTouch')}</h2>
                <p className="bl-section-lede">{t('business.contactSectionLede')}</p>
                <div className="bl-contact-quick">
                  {phoneHref ? (
                    <a className="bl-contact-quick-link" href={phoneHref}>
                      <i className="bi bi-telephone" aria-hidden="true" />
                      {company.phone}
                    </a>
                  ) : null}
                  {emailHref ? (
                    <a className="bl-contact-quick-link" href={emailHref}>
                      <i className="bi bi-envelope" aria-hidden="true" />
                      {company.email}
                    </a>
                  ) : null}
                </div>
              </div>
              <div className="bl-contact-form-wrap">
                <BusinessContactForm slug={company.slug || slug} businessName={company.name} />
              </div>
            </div>
          </Reveal>
        ) : null}
      </main>

      <footer className="bl-footer">
        <div className="bl-footer-grid">
          <div className="bl-footer-brand">
            <BrandMark company={company} size="sm" />
            <div>
              <strong>{company.name}</strong>
              {company.industry_name ? <span>{company.industry_name}</span> : null}
            </div>
          </div>

          {navItems.length > 0 ? (
            <nav className="bl-footer-nav" aria-label={t('business.footerNav')}>
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="bl-footer-link"
                  onClick={() => scrollToSection(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          ) : null}

          <div className="bl-footer-contact">
            {company.phone ? <a href={phoneHref}>{company.phone}</a> : null}
            {company.email ? <a href={emailHref}>{company.email}</a> : null}
            {company.address_label ? (
              <a href={mapHref} target="_blank" rel="noreferrer">
                {company.address_label}
              </a>
            ) : null}
          </div>
        </div>
        <div className="bl-footer-bottom">
          <span>
            © {new Date().getFullYear()} {company.name}
          </span>
          <a href={homeHref} className="bl-footer-powered">
            {t('business.poweredBy')}
          </a>
        </div>
      </footer>

      {showVisitorDock ? (
        <div className="bl-dock" role="navigation" aria-label={t('business.quickActions')}>
          {(openNowStatus || todayHours) ? (
            <div className={`bl-dock-status bl-dock-status--${openNowStatus || 'hours'}`}>
              <i
                className={`bi ${openNowStatus ? 'bi-circle-fill' : 'bi-clock'}`}
                aria-hidden="true"
              />
              <span>
                {openNowStatus === 'open'
                  ? t('business.openNow')
                  : openNowStatus === 'closed'
                    ? t('business.closedNow')
                    : t('business.todayHours')}
                {todayHours ? ` · ${todayHours}` : ''}
              </span>
            </div>
          ) : null}
          <div className="bl-dock-actions">
            {phoneHref ? (
              <a className="bl-dock-btn bl-dock-btn--call" href={phoneHref}>
                <i className="bi bi-telephone-fill" aria-hidden="true" />
                <span>{t('business.call')}</span>
              </a>
            ) : null}
            {canContact ? (
              <button
                type="button"
                className="bl-dock-btn bl-dock-btn--message"
                onClick={() => scrollToSection('contact')}
              >
                <i className="bi bi-chat-dots-fill" aria-hidden="true" />
                <span>{t('business.message')}</span>
              </button>
            ) : null}
            {mapHref ? (
              <a
                className="bl-dock-btn bl-dock-btn--map"
                href={mapHref}
                target="_blank"
                rel="noreferrer"
              >
                <i className="bi bi-geo-alt-fill" aria-hidden="true" />
                <span>{t('business.directions')}</span>
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
