import { Link } from 'react-router-dom'
import { useLocale } from '../../hooks/useLocale'

export default function Features() {
  const { t } = useLocale()
  const features = [
    { title: t('features.i1Title'), text: t('features.i1Text'), icon: 'bi-layers' },
    { title: t('features.i2Title'), text: t('features.i2Text'), icon: 'bi-people' },
    { title: t('features.i3Title'), text: t('features.i3Text'), icon: 'bi-box-seam' },
    { title: t('features.i4Title'), text: t('features.i4Text'), icon: 'bi-receipt' },
    { title: t('features.i5Title'), text: t('features.i5Text'), icon: 'bi-person-check' },
    { title: t('features.i6Title'), text: t('features.i6Text'), icon: 'bi-buildings' },
  ]

  return (
    <>
      <section className="page-hero page-hero--luxe">
        <div className="container page-hero__inner">
          <p className="eyebrow">{t('features.kicker')}</p>
          <h1>{t('features.title')}</h1>
          <p className="page-hero__lede">{t('features.lede')}</p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <div className="feature-card-grid">
            {features.map((feature, index) => (
              <article className="feature-card" key={feature.title}>
                <div className="feature-card__meta">
                  <span className="feature-row__icon">
                    <i className={`bi ${feature.icon}`} aria-hidden="true" />
                  </span>
                  <span className="feature-row__num">0{index + 1}</span>
                </div>
                <h2>{feature.title}</h2>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
          <div className="text-center mt-5">
            <Link to="/register" className="btn btn-brand btn-lg">
              {t('common.startFree')}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
