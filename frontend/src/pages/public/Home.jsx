import { Link } from 'react-router-dom'
import Reveal from '../../components/Reveal'
import HomeTestTools from '../../components/HomeTestTools'
import { useLocale } from '../../hooks/useLocale'

export default function Home() {
  const { t } = useLocale()

  const features = [
    { title: t('home.f1Title'), text: t('home.f1Text'), icon: 'bi-people' },
    { title: t('home.f2Title'), text: t('home.f2Text'), icon: 'bi-receipt' },
    { title: t('home.f3Title'), text: t('home.f3Text'), icon: 'bi-person-check' },
  ]

  const steps = [
    { number: '01', title: t('home.s1Title'), text: t('home.s1Text') },
    { number: '02', title: t('home.s2Title'), text: t('home.s2Text') },
    { number: '03', title: t('home.s3Title'), text: t('home.s3Text') },
  ]

  const trades = [
    { name: t('home.tradeBarber'), icon: 'bi-scissors' },
    { name: t('home.tradeMechanic'), icon: 'bi-wrench-adjustable' },
    { name: t('home.tradeBakery'), icon: 'bi-basket2' },
    { name: t('home.tradeRestaurant'), icon: 'bi-cup-hot' },
    { name: t('home.tradePlumbing'), icon: 'bi-droplet-half' },
    { name: t('home.tradeRetail'), icon: 'bi-shop' },
    { name: t('home.tradeClinic'), icon: 'bi-heart-pulse' },
    { name: t('home.tradeConstruction'), icon: 'bi-bricks' },
  ]

  const metrics = [
    { value: t('home.metricDesk'), label: t('home.metricDeskLabel') },
    { value: t('home.metricRoles'), label: t('home.metricRolesLabel') },
    { value: t('home.metricPresets'), label: t('home.metricPresetsLabel') },
    { value: t('home.metricFree'), label: t('home.metricFreeLabel') },
  ]

  return (
    <div className="home-luxe">
      <HomeTestTools />
      <section className="hl-hero" aria-label="BizFlow">
        <div className="hl-hero__ambient" aria-hidden="true" />
        <div className="container hl-hero__grid">
          <div className="hl-hero__copy">
            <p className="hl-kicker">
              <span className="hl-kicker__dot" />
              {t('home.kicker')}
            </p>
            <h1>
              {t('home.titleBefore')}
              <em>{t('home.titleEm')}</em>
            </h1>
            <p className="hl-lede">{t('home.lede')}</p>
            <div className="hl-actions">
              <Link to="/register" className="btn btn-brand btn-lg">
                {t('common.startFree')}
              </Link>
              <Link to="/features" className="btn btn-outline-brand btn-lg">
                {t('home.explore')}
              </Link>
            </div>
            <ul className="hl-proof">
              <li>{t('home.proof1')}</li>
              <li>{t('home.proof2')}</li>
              <li>{t('home.proof3')}</li>
            </ul>
          </div>

          <div className="hl-preview" aria-hidden="true">
            <div className="hl-preview__frame">
              <div className="hl-preview__chrome">
                <span />
                <span />
                <span />
                <strong>BizFlow</strong>
              </div>
              <div className="hl-preview__body">
                <div className="hl-preview__side">
                  <em>{t('home.workspace')}</em>
                  <b className="is-on">{t('home.dashboard')}</b>
                  <b>{t('home.customers')}</b>
                  <b>{t('home.invoices')}</b>
                  <b>{t('home.tasks')}</b>
                </div>
                <div className="hl-preview__main">
                  <div className="hl-preview__stats">
                    <div>
                      <small>{t('home.revenue')}</small>
                      <strong>€12,480</strong>
                    </div>
                    <div>
                      <small>{t('home.openJobs')}</small>
                      <strong>18</strong>
                    </div>
                    <div>
                      <small>{t('home.lowStock')}</small>
                      <strong>4</strong>
                    </div>
                  </div>
                  <div className="hl-preview__rows">
                    <div>
                      <span>Invoice #1042</span>
                      <em className="is-gold">{t('home.paid')}</em>
                    </div>
                    <div>
                      <span>Bay 3 — brake job</span>
                      <em>{t('home.assigned')}</em>
                    </div>
                    <div>
                      <span>Salon — 14:30</span>
                      <em>{t('home.today')}</em>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="hl-metrics">
        <div className="container hl-metrics__row">
          {metrics.map((item) => (
            <div key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="hl-section">
        <div className="container">
          <Reveal className="hl-intro">
            <p className="hl-kicker">{t('home.capKicker')}</p>
            <h2>{t('home.capTitle')}</h2>
            <p>{t('home.capLede')}</p>
          </Reveal>
          <div className="hl-features">
            {features.map((item, index) => (
              <Reveal as="article" key={item.title} delay={index * 90} className="hl-feature">
                <div className="hl-feature__top">
                  <span className="hl-feature__icon">
                    <i className={`bi ${item.icon}`} aria-hidden="true" />
                  </span>
                  <span className="hl-feature__index">0{index + 1}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="hl-section hl-section--mesh">
        <div className="container">
          <Reveal className="hl-intro">
            <p className="hl-kicker">{t('home.howKicker')}</p>
            <h2>{t('home.howTitle')}</h2>
          </Reveal>
          <div className="hl-steps">
            {steps.map((item, index) => (
              <Reveal as="article" key={item.number} delay={index * 80} className="hl-step">
                <span>{item.number}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="hl-section">
        <div className="container">
          <Reveal className="hl-intro">
            <p className="hl-kicker">{t('home.tradesKicker')}</p>
            <h2>{t('home.tradesTitle')}</h2>
            <p>{t('home.tradesLede')}</p>
          </Reveal>
          <div className="hl-trades">
            {trades.map((trade, index) => (
              <Reveal key={trade.name} delay={index * 40} className="hl-trade">
                <i className={`bi ${trade.icon}`} aria-hidden="true" />
                {trade.name}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="hl-cta">
        <div className="container">
          <Reveal className="hl-cta__panel">
            <p className="hl-kicker hl-kicker--light">{t('home.ready')}</p>
            <h2>{t('home.ctaTitle')}</h2>
            <p>{t('home.ctaLede')}</p>
            <Link to="/register" className="btn btn-accent btn-lg">
              {t('home.ctaBtn')}
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
