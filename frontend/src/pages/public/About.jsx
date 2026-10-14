import { Link } from 'react-router-dom'
import { useLocale } from '../../hooks/useLocale'

export default function About() {
  const { t } = useLocale()
  const values = [
    { title: t('about.v1Title'), text: t('about.v1Text'), icon: 'bi-shield-lock' },
    { title: t('about.v2Title'), text: t('about.v2Text'), icon: 'bi-phone' },
    { title: t('about.v3Title'), text: t('about.v3Text'), icon: 'bi-briefcase' },
  ]

  return (
    <>
      <section className="page-hero page-hero--luxe">
        <div className="container page-hero__inner">
          <p className="eyebrow">{t('about.kicker')}</p>
          <h1>{t('about.title')}</h1>
          <p className="page-hero__lede">{t('about.lede')}</p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <div className="feature-card-grid">
            {values.map((item) => (
              <article key={item.title} className="feature-card">
                <span className="feature-row__icon">
                  <i className={`bi ${item.icon}`} aria-hidden="true" />
                </span>
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
          <div className="mt-5 d-flex flex-wrap gap-2">
            <Link to="/register" className="btn btn-brand btn-lg">
              {t('about.create')}
            </Link>
            <Link to="/contact" className="btn btn-outline-brand btn-lg">
              {t('common.contact')}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
