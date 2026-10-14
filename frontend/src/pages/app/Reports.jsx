import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatCard from '../../components/StatCard'
import DataTable from '../../components/DataTable'
import LoadingSpinner from '../../components/LoadingSpinner'
import Alert from '../../components/Alert'
import { reportService } from '../../services/reportService'
import { formatCurrency, formatDate, getErrorMessage } from '../../utils/formatters'
import { useLocale } from '../../hooks/useLocale'
import { usePlanEntitlements } from '../../hooks/usePlanEntitlements'

export default function Reports() {
  const { t } = useLocale()
  const { canViewReports } = usePlanEntitlements()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sales, setSales] = useState(null)
  const [inventory, setInventory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    if (!canViewReports) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (from) params.from = from
      if (to) params.to = to
      const [salesRes, inventoryRes] = await Promise.all([
        reportService.sales(params),
        reportService.inventory(),
      ])
      setSales(salesRes.data)
      setInventory(inventoryRes.data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [canViewReports])

  const lowStockColumns = [
    { key: 'name', label: 'Product' },
    { key: 'sku', label: 'SKU' },
    { key: 'stock_quantity', label: 'Stock' },
    { key: 'min_stock_level', label: 'Min' },
  ]

  const dayColumns = [
    { key: 'day', label: 'Day', render: (row) => formatDate(row.day) },
    { key: 'count', label: 'Orders' },
    { key: 'total', label: 'Total', render: (row) => formatCurrency(row.total) },
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{t('app.reportsTitle')}</h1>
          <p className="text-secondary mb-0">Sales and inventory health</p>
        </div>
      </div>
      {!canViewReports ? (
        <div className="panel" style={{ maxWidth: 560 }}>
          <p className="mb-3">{t('pricing.reportsLocked')}</p>
          <Link to="/app/billing" className="btn btn-brand">
            {t('pricing.upgradeCta')}
          </Link>
        </div>
      ) : null}
      {canViewReports ? (
        <>
          <div className="panel mb-3">
            <form
              className="row g-2 align-items-end"
              onSubmit={(event) => {
                event.preventDefault()
                load()
              }}
            >
              <div className="col-md-3">
                <label className="form-label">From</label>
                <input type="date" className="form-control" value={from} onChange={(event) => setFrom(event.target.value)} />
              </div>
              <div className="col-md-3">
                <label className="form-label">To</label>
                <input type="date" className="form-control" value={to} onChange={(event) => setTo(event.target.value)} />
              </div>
              <div className="col-auto">
                <button type="submit" className="btn btn-brand">
                  Refresh
                </button>
              </div>
            </form>
          </div>
          {error ? <Alert type="danger" message={error} /> : null}
          {loading ? <LoadingSpinner /> : null}
          {!loading && sales ? (
            <>
              <div className="row g-3 mb-3">
                <div className="col-md-3">
                  <StatCard label="Orders" value={sales.orders_count ?? 0} icon="bi-cart3" />
                </div>
                <div className="col-md-3">
                  <StatCard label="Orders total" value={formatCurrency(sales.orders_total)} icon="bi-currency-euro" tone="amber" />
                </div>
                <div className="col-md-3">
                  <StatCard label="Paid invoices" value={sales.paid_invoices_count ?? 0} icon="bi-receipt" tone="ink" />
                </div>
                <div className="col-md-3">
                  <StatCard label="Paid total" value={formatCurrency(sales.paid_invoices_total)} icon="bi-graph-up" />
                </div>
              </div>
              <div className="panel mb-3">
                <h2 className="h5 mb-3">Sales by day</h2>
                <DataTable columns={dayColumns} rows={sales.by_day || []} emptyTitle="No sales in this range" />
              </div>
            </>
          ) : null}
          {!loading && inventory ? (
            <>
              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <StatCard label="Total SKUs" value={inventory.total_skus ?? 0} icon="bi-box-seam" />
                </div>
                <div className="col-md-4">
                  <StatCard label="Stock value" value={formatCurrency(inventory.total_stock_value)} icon="bi-cash-stack" tone="amber" />
                </div>
                <div className="col-md-4">
                  <StatCard label="Low stock items" value={inventory.low_stock_count ?? inventory.low_stock?.length ?? 0} icon="bi-exclamation-triangle" tone="ink" />
                </div>
              </div>
              <div className="panel">
                <h2 className="h5 mb-3">Low stock</h2>
                <DataTable columns={lowStockColumns} rows={inventory.low_stock || []} emptyTitle="No low stock items" />
              </div>
            </>
          ) : null}
        </>
      ) : null}
    </>
  )
}
