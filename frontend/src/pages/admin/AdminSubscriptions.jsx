import { useCallback, useEffect, useState } from 'react'
import DataTable from '../../components/DataTable'
import Pagination from '../../components/Pagination'
import Alert from '../../components/Alert'
import { adminService } from '../../services/adminService'
import { usePagination } from '../../hooks/usePagination'
import { formatDate, getErrorMessage, unwrapList } from '../../utils/formatters'

export default function AdminSubscriptions() {
  const { page, setPage, meta, setMeta, params } = usePagination()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await adminService.subscriptions(params)
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
      key: 'plan',
      label: 'Plan',
      render: (row) => row.plan?.name || '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <span className="badge badge-soft">{row.status}</span>,
    },
    {
      key: 'stripe_subscription_id',
      label: 'Stripe ID',
      render: (row) => row.stripe_subscription_id || '—',
    },
    {
      key: 'current_period_end',
      label: 'Period end',
      render: (row) => formatDate(row.current_period_end),
    },
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Subscriptions</h1>
          <p className="text-secondary mb-0">SaaS subscription status across companies</p>
        </div>
      </div>
      {error ? <Alert type="danger" message={error} /> : null}
      <div className="panel">
        <DataTable columns={columns} rows={rows} loading={loading} emptyMessage="No subscriptions yet" />
        <Pagination meta={meta} onPageChange={setPage} />
      </div>
    </>
  )
}
