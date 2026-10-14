import { useCallback, useEffect, useState } from 'react'
import DataTable from '../../components/DataTable'
import Pagination from '../../components/Pagination'
import Alert from '../../components/Alert'
import { adminService } from '../../services/adminService'
import { usePagination } from '../../hooks/usePagination'
import { formatDateTime, getErrorMessage, unwrapList } from '../../utils/formatters'

export default function AdminActivityLogs() {
  const { page, setPage, meta, setMeta, params } = usePagination()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await adminService.activityLogs(params)
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
      key: 'created_at',
      label: 'When',
      render: (row) => formatDateTime(row.created_at),
    },
    {
      key: 'user',
      label: 'User',
      render: (row) => row.user?.email || '—',
    },
    {
      key: 'company',
      label: 'Company',
      render: (row) => row.company?.name || '—',
    },
    { key: 'action', label: 'Action' },
    {
      key: 'subject',
      label: 'Subject',
      render: (row) => (row.subject_type ? `${String(row.subject_type).split('\\').pop()} #${row.subject_id}` : '—'),
    },
    { key: 'ip_address', label: 'IP', render: (row) => row.ip_address || '—' },
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Activity</h1>
          <p className="text-secondary mb-0">System audit trail</p>
        </div>
      </div>
      {error ? <Alert type="danger" message={error} /> : null}
      <div className="panel">
        <DataTable columns={columns} rows={rows} loading={loading} emptyMessage="No activity yet" />
        <Pagination meta={meta} onPageChange={setPage} />
      </div>
    </>
  )
}
