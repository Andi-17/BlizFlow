import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import LoadingSpinner from '../../components/LoadingSpinner'
import Alert from '../../components/Alert'
import { invoiceService } from '../../services/invoiceService'
import { useAlert } from '../../hooks/useAlert'
import { useCompany } from '../../hooks/useCompany'
import { useLocale } from '../../hooks/useLocale'
import { normalizeInvoiceSettings } from '../../utils/businessExtras'
import { formatCurrency, formatDate, getErrorMessage } from '../../utils/formatters'

function customerAddress(customer) {
  if (!customer) return null
  return [customer.address_line1, customer.address_line2, customer.city, customer.state, customer.postal_code, customer.country]
    .filter(Boolean)
    .join(', ')
}

function companyAddress(company) {
  if (!company) return null
  return [
    company.address_line1,
    company.address_line2,
    company.city,
    company.state,
    company.postal_code,
    company.country,
  ]
    .filter(Boolean)
    .join(', ')
}

export default function InvoiceDetail() {
  const { id } = useParams()
  const { t } = useLocale()
  const { company } = useCompany()
  const { success, error: showError } = useAlert()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [marking, setMarking] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const settings = useMemo(
    () => normalizeInvoiceSettings(company?.invoice_settings, company?.industry || 'general'),
    [company],
  )

  const load = async () => {
    setLoading(true)
    try {
      const response = await invoiceService.show(id)
      setInvoice(response.data)
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const markPaid = async () => {
    setMarking(true)
    try {
      const response = await invoiceService.markPaid(id)
      setInvoice(response.data)
      success(response.message || 'Marked as paid')
    } catch (err) {
      showError(getErrorMessage(err))
    } finally {
      setMarking(false)
    }
  }

  const downloadPdf = async () => {
    setDownloading(true)
    try {
      await invoiceService.downloadPdf(id, invoice?.invoice_number ? `${invoice.invoice_number}.pdf` : null)
      success(t('app.invoicePdfDownloaded'))
    } catch (err) {
      showError(getErrorMessage(err, t('app.invoicePdfFailed')))
    } finally {
      setDownloading(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <Alert type="danger" message={error} />
  if (!invoice) return null

  const title = settings.custom_title || t('app.invoiceTitle')
  const billToAddress = customerAddress(invoice.customer)
  const fromAddress = companyAddress(company)

  return (
    <>
      <div className="page-header no-print">
        <div>
          <h1>
            {title} {invoice.invoice_number}
          </h1>
          <p className="text-secondary mb-0 text-capitalize">
            {settings.show_status ? `${invoice.status} · ` : null}
            {settings.show_due_date ? `Due ${formatDate(invoice.due_date)}` : null}
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/app/invoices" className="btn btn-outline-brand">
            Back
          </Link>
          <button type="button" className="btn btn-outline-brand" onClick={() => window.print()}>
            {t('app.printInvoice')}
          </button>
          <button type="button" className="btn btn-outline-brand" disabled={downloading} onClick={downloadPdf}>
            {downloading ? t('app.invoicePdfDownloading') : t('app.downloadPdf')}
          </button>
          {invoice.status !== 'paid' ? (
            <button type="button" className="btn btn-brand" disabled={marking} onClick={markPaid}>
              {marking ? 'Updating…' : 'Mark paid'}
            </button>
          ) : null}
        </div>
      </div>

      <div className="panel invoice-sheet">
        <div className="invoice-sheet__header">
          <div>
            {settings.show_logo && company?.logo_url ? (
              <img src={company.logo_url} alt="" className="invoice-sheet__logo" />
            ) : null}
            {settings.show_company_name ? <h2 className="h4 mb-1">{company?.name}</h2> : null}
            {settings.show_company_address && fromAddress ? (
              <p className="small text-secondary mb-1">{fromAddress}</p>
            ) : null}
            {settings.show_company_phone && company?.phone ? (
              <p className="small mb-0">{company.phone}</p>
            ) : null}
            {settings.show_company_email && company?.email ? (
              <p className="small mb-0">{company.email}</p>
            ) : null}
          </div>
          <div className="text-end">
            <p className="eyebrow mb-1">{title}</p>
            <strong className="d-block">{invoice.invoice_number}</strong>
            {settings.show_status ? (
              <span className="badge badge-soft text-capitalize mt-2">{invoice.status}</span>
            ) : null}
            {settings.show_issue_date ? (
              <p className="small mb-0 mt-2">Issued {formatDate(invoice.issue_date)}</p>
            ) : null}
            {settings.show_due_date ? (
              <p className="small mb-0">Due {formatDate(invoice.due_date)}</p>
            ) : null}
          </div>
        </div>

        {(settings.show_customer_name ||
          settings.show_customer_email ||
          settings.show_customer_phone ||
          settings.show_customer_address) && (
          <div className="invoice-sheet__party mb-4">
            <p className="eyebrow mb-1">{t('app.invoiceBillTo')}</p>
            {settings.show_customer_name ? (
              <p className="mb-1 fw-semibold">
                {invoice.customer?.name || `Customer #${invoice.customer_id}`}
              </p>
            ) : null}
            {settings.show_customer_email && invoice.customer?.email ? (
              <p className="small mb-0">{invoice.customer.email}</p>
            ) : null}
            {settings.show_customer_phone && invoice.customer?.phone ? (
              <p className="small mb-0">{invoice.customer.phone}</p>
            ) : null}
            {settings.show_customer_address && billToAddress ? (
              <p className="small text-secondary mb-0">{billToAddress}</p>
            ) : null}
          </div>
        )}

        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit</th>
                <th className="text-end">Line total</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item) => (
                <tr key={item.id}>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.unit_price)}</td>
                  <td className="text-end">
                    {formatCurrency(item.line_total ?? item.quantity * item.unit_price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="d-flex flex-column align-items-end gap-1">
          <div>
            Subtotal: <strong>{formatCurrency(invoice.subtotal)}</strong>
          </div>
          <div>
            Discount: <strong>{formatCurrency(invoice.discount)}</strong>
          </div>
          <div>
            Tax: <strong>{formatCurrency(invoice.tax)}</strong>
          </div>
          <div className="fs-5">
            Total: <strong>{formatCurrency(invoice.total)}</strong>
          </div>
        </div>

        {settings.show_notes && invoice.notes ? (
          <div className="mt-4">
            <p className="eyebrow mb-1">{t('app.invoiceNotes')}</p>
            <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
              {invoice.notes}
            </p>
          </div>
        ) : null}

        {settings.custom_footer ? (
          <p className="small text-secondary mt-4 mb-0">{settings.custom_footer}</p>
        ) : null}
      </div>
    </>
  )
}
