import { useCallback, useEffect, useState } from 'react'
import DataTable from '../../components/DataTable'
import Pagination from '../../components/Pagination'
import Alert from '../../components/Alert'
import { adminService } from '../../services/adminService'
import { usePagination } from '../../hooks/usePagination'
import { formatCurrency, formatDate, getErrorMessage, unwrapList } from '../../utils/formatters'

export default function AdminPayments() {
  const { page, setPage, meta, setMeta, params } = usePagination()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await adminService.payments(params)
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
      render: (row) => row.company?.name || `#${row.company_id}`,
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => formatCurrency(row.amount, row.currency || 'EUR'),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <span className="badge badge-soft">{row.status}</span>,
    },
    {
      key: 'stripe_payment_intent_id',
      label: 'Payment intent',
      render: (row) => row.stripe_payment_intent_id || '—',
    },
    {
      key: 'paid_at',
      label: 'Paid',
      render: (row) => formatDate(row.paid_at || row.created_at),
    },
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Payments</h1>
          <p className="text-secondary mb-0">Stripe payment records</p>
        </div>
      </div>
      {error ? <Alert type="danger" message={error} /> : null}
      <div className="panel">
        <DataTable columns={columns} rows={rows} loading={loading} emptyMessage="No payments yet" />
        <Pagination meta={meta} onPageChange={setPage} />
      </div>
    </>
  )
}
