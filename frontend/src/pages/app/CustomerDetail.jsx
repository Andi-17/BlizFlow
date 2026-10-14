import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import LoadingSpinner from '../../components/LoadingSpinner'
import Alert from '../../components/Alert'
import { customerService } from '../../services/customerService'
import { useLocale } from '../../hooks/useLocale'
import { formatCurrency, formatDate, getErrorMessage } from '../../utils/formatters'

const EVENT_ICON = {
  order: 'bi-bag-check',
  invoice: 'bi-receipt',
  payment: 'bi-cash-coin',
  contact: 'bi-chat-dots',
  customer_created: 'bi-person-plus',
}

export default function CustomerDetail() {
  const { id } = useParams()
  const { t } = useLocale()
  const [customer, setCustomer] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      try {
        const [customerRes, timelineRes] = await Promise.all([
          customerService.show(id),
          customerService.timeline(id),
        ])
        if (!active) return
        setCustomer(customerRes.data)
        setTimeline(timelineRes.data?.events || [])
        setError(null)
      } catch (err) {
        if (active) setError(getErrorMessage(err))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [id])

  if (loading) return <LoadingSpinner />
  if (error) return <Alert type="danger" message={error} />
  if (!customer) return null

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{customer.name}</h1>
          <p className="text-secondary mb-0">
            {t('app.customerSince', { date: formatDate(customer.created_at) })}
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/app/customers" className="btn btn-outline-brand">
            Back
          </Link>
          <Link to={`/app/customers/${id}/edit`} className="btn btn-brand">
            Edit
          </Link>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-5">
          <div className="panel h-100">
            <p className="eyebrow mb-2">{t('app.customerDetails')}</p>
            <dl className="row mb-0">
              <dt className="col-sm-4">Email</dt>
              <dd className="col-sm-8">{customer.email || '—'}</dd>
              <dt className="col-sm-4">Phone</dt>
              <dd className="col-sm-8">{customer.phone || '—'}</dd>
              <dt className="col-sm-4">Company</dt>
              <dd className="col-sm-8">{customer.company_name || '—'}</dd>
              <dt className="col-sm-4">Address</dt>
              <dd className="col-sm-8">
                {[
                  customer.address_line1,
                  customer.address_line2,
                  customer.city,
                  customer.state,
                  customer.postal_code,
                  customer.country,
                ]
                  .filter(Boolean)
                  .join(', ') || '—'}
              </dd>
              <dt className="col-sm-4">Notes</dt>
              <dd className="col-sm-8">{customer.notes || '—'}</dd>
            </dl>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="panel customer-timeline h-100">
            <p className="eyebrow mb-1">{t('app.timelineKicker')}</p>
            <h2 className="h5 mb-3">{t('app.timelineTitle')}</h2>

            {!timeline.length ? (
              <p className="text-secondary mb-0">{t('app.timelineEmpty')}</p>
            ) : (
              <ol className="customer-timeline__list">
                {timeline.map((event, index) => {
                  const content = (
                    <>
                      <span className={`customer-timeline__icon customer-timeline__icon--${event.type}`}>
                        <i className={`bi ${EVENT_ICON[event.type] || 'bi-circle'}`} aria-hidden="true" />
                      </span>
                      <span className="customer-timeline__body">
                        <span className="customer-timeline__date">{formatDate(event.date || event.at)}</span>
                        <strong className="customer-timeline__title">{event.title}</strong>
                        <span className="customer-timeline__meta">
                          {event.amount != null ? formatCurrency(event.amount) : null}
                          {event.status ? (
                            <span className="text-capitalize">
                              {event.amount != null ? ' · ' : ''}
                              {event.status}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </>
                  )

                  return (
                    <li key={`${event.type}-${event.at}-${index}`} className="customer-timeline__item">
                      {event.href ? (
                        <Link to={event.href} className="customer-timeline__link">
                          {content}
                        </Link>
                      ) : (
                        <div className="customer-timeline__link customer-timeline__link--static">{content}</div>
                      )}
                    </li>
                  )
                })}
              </ol>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
