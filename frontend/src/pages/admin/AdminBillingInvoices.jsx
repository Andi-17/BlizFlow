import { useCallback, useEffect, useState } from 'react'
import DataTable from '../../components/DataTable'
import Pagination from '../../components/Pagination'
import Alert from '../../components/Alert'
import { adminService } from '../../services/adminService'
import { usePagination } from '../../hooks/usePagination'
import { formatCurrency, formatDate, getErrorMessage, unwrapList } from '../../utils/formatters'

export default function AdminBillingInvoices() {
  const { page, setPage, meta, setMeta, params } = usePagination()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await adminService.billingInvoices(params)
      const { items, meta: nextMeta } = unwrapList(response.data)
      setRows(items)
      setMeta(nextMeta)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    load()
  }, [load])

  const columns = [
    {
      key: 'company',
      label: 'Company',
      render: (row) => row.company?.name || '—',
    },
    { key: 'number', label: 'Number', render: (row) => row.number || '—' },
    {
      key: 'amount_paid',
      label: 'Paid',
      render: (row) => formatCurrency(row.amount_paid ?? row.amount_due, row.currency || 'EUR'),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <span className="badge badge-soft">{row.status}</span>,
    },
    {
      key: 'paid_at',
      label: 'Date',
      render: (row) => formatDate(row.paid_at || row.created_at),
    },
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Billing invoices</h1>
          <p className="text-secondary mb-0">SaaS invoices from Stripe</p>
        </div>
      </div>
      {error ? <Alert type="danger" message={error} /> : null}
      <div className="panel">
        <DataTable columns={columns} rows={rows} loading={loading} emptyMessage="No billing invoices yet" />
        <Pagination meta={meta} onPageChange={setPage} />
      </div>
    </>
  )
}
