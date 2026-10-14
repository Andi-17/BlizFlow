import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SmartSearchBar from '../../components/SmartSearchBar'
import StatCard from '../../components/StatCard'
import LoadingSpinner from '../../components/LoadingSpinner'
import Alert from '../../components/Alert'
import { reportService } from '../../services/reportService'
import { formatCurrency, getErrorMessage } from '../../utils/formatters'
import { useCompany } from '../../hooks/useCompany'
import { useIndustry } from '../../hooks/useIndustry'
import { getStatLabel, getStatValue, resolveActionLabel } from '../../utils/industryPanels'
import { useLocale } from '../../hooks/useLocale'

export default function Dashboard() {
  const { company } = useCompany()
  const { label, industry, panel, slug } = useIndustry()
  const { t } = useLocale()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [checklistHidden, setChecklistHidden] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      try {
        const response = await reportService.dashboardStats()
        if (active) setStats(response.data)
      } catch (err) {
        if (active) setError(getErrorMessage(err))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [company?.id])

  useEffect(() => {
    if (!company?.id) return
    setChecklistHidden(localStorage.getItem(`bizflow_setup_done_${company.id}`) === '1')
  }, [company?.id])

  const setupItems = useMemo(() => {
    if (!company) return []
    return [
      {
        key: 'logo',
        done: Boolean(company.logo_url || company.logo_path),
        label: t('app.setupLogo'),
        to: '/app/settings',
      },
      {
        key: 'phone',
        done: Boolean(company.phone),
        label: t('app.setupPhone'),
        to: '/app/settings',
      },
      {
        key: 'public',
        done: Boolean(company.is_public),
        label: t('app.setupPublic'),
        to: '/app/settings',
      },
    ].filter((item) => !item.done)
  }, [company, t])

  const showChecklist = Boolean(company) && !checklistHidden && setupItems.length > 0

  const dismissChecklist = () => {
    if (company?.id) {
      localStorage.setItem(`bizflow_setup_done_${company.id}`, '1')
    }
    setChecklistHidden(true)
  }

  return (
    <div className={`industry-dashboard industry-dashboard--${slug}`}>
      <div className="dashboard-hero panel mb-4">
        <div className="d-flex flex-wrap justify-content-between gap-3 align-items-end">
          <div>
            <p className="eyebrow mb-2">
              <i className={`bi ${industry.icon || 'bi-building'} me-2`} aria-hidden="true" />
              {industry.name}
            </p>
            <h1 className="mb-1">{panel.headline}</h1>
            <p className="text-secondary mb-0">{company?.tagline || panel.focus}</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            {panel.actions.map((action) => (
              <Link
                key={`${action.to}-${action.label || action.labelKey}`}
                to={action.to}
                className={action.primary ? 'btn btn-brand' : 'btn btn-outline-brand'}
              >
                {resolveActionLabel(action, label)}
              </Link>
            ))}
          </div>
        </div>

        <div className="dashboard-smart-search mt-4">
          <p className="eyebrow mb-2">{t('app.smartSearchKicker')}</p>
          <h2 className="h5 mb-2">{t('app.smartSearchTitle')}</h2>
          <SmartSearchBar />
        </div>
      </div>

      {showChecklist ? (
        <div className="panel setup-checklist mb-4">
          <div className="d-flex justify-content-between gap-3 align-items-start mb-2">
            <div>
              <p className="eyebrow mb-1">{t('app.setupKicker')}</p>
              <h2 className="h5 mb-1">{t('app.setupTitle')}</h2>
              <p className="text-secondary mb-0">{t('app.setupLede')}</p>
            </div>
            <button type="button" className="btn btn-sm btn-outline-brand" onClick={dismissChecklist}>
              {t('app.setupDismiss')}
            </button>
          </div>
          <ul className="setup-checklist__list mb-0">
            {setupItems.map((item) => (
              <li key={item.key}>
                <i className="bi bi-circle" aria-hidden="true" />
                <span>{item.label}</span>
                <Link to={item.to} className="btn btn-sm btn-outline-brand">
                  {t('app.setupOpen')}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? <Alert type="danger" message={error} /> : null}
      {loading ? <LoadingSpinner /> : null}

      {!loading && stats ? (
        <>
          <div className="row g-3 mb-4">
            <div className="col-lg-8">
              <div className="row g-3">
                {panel.stats.map((stat) => (
                  <div className="col-sm-6" key={stat.key}>
                    <StatCard
                      label={getStatLabel(stat.key, label)}
                      value={getStatValue(stats, stat.key)}
                      icon={stat.icon}
                      tone={stat.tone}
                    />
                  </div>
                ))}
                <div className="col-sm-6">
                  <StatCard label={t('app.revenuePaid')} value={formatCurrency(stats.revenue_total)} icon="bi-currency-euro" tone="amber" />
                </div>
                <div className="col-sm-6">
                  <StatCard
                    label={t('app.ordersTotal', { label: label('orders') })}
                    value={formatCurrency(stats.orders_total)}
                    icon="bi-graph-up"
                  />
                </div>
                <div className="col-sm-6">
                  <StatCard
                    label={t('app.outstanding')}
                    value={formatCurrency(stats.outstanding_invoices)}
                    icon="bi-exclamation-circle"
                    tone="ink"
                  />
                </div>
                <div className="col-sm-6">
                  <StatCard
                    label={t('app.lowInventory', { label: label('inventory').toLowerCase() })}
                    value={stats.low_stock_count ?? 0}
                    icon="bi-clipboard-data"
                    tone="amber"
                  />
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="panel industry-focus-panel h-100">
                <p className="eyebrow mb-2">{t('app.today')}</p>
                <h2 className="h5 mb-2">{t('app.focusFor', { name: industry.name })}</h2>
                <p className="text-secondary mb-3">{panel.focus}</p>
                <ul className="industry-tips mb-0">
                  {panel.tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
