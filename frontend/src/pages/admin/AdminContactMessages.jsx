import { useCallback, useEffect, useState } from 'react'
import DataTable from '../../components/DataTable'
import Pagination from '../../components/Pagination'
import Alert from '../../components/Alert'
import { adminService } from '../../services/adminService'
import { usePagination } from '../../hooks/usePagination'
import { useAlert } from '../../hooks/useAlert'
import { formatDate, getErrorMessage, unwrapList } from '../../utils/formatters'

export default function AdminContactMessages() {
  const { success, error: showError } = useAlert()
  const { page, setPage, meta, setMeta, params } = usePagination()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await adminService.contactMessages(params)
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

  const markRead = async (row) => {
    try {
      await adminService.markMessageRead(row.id)
      success('Marked as read')
      load()
    } catch (err) {
      showError(getErrorMessage(err))
    }
  }

  const columns = [
    { key: 'name', label: 'From', render: (row) => <strong>{row.name}</strong> },
    { key: 'email', label: 'Email' },
    { key: 'subject', label: 'Subject', render: (row) => row.subject || '—' },
    {
      key: 'message',
      label: 'Message',
      render: (row) => <span className="text-truncate d-inline-block" style={{ maxWidth: 280 }}>{row.message}</span>,
    },
    {
      key: 'read',
      label: 'Status',
      render: (row) =>
        row.read_at || row.is_read ? (
          <span className="badge badge-soft">Read</span>
        ) : (
          <span className="badge badge-amber">New</span>
        ),
    },
    { key: 'created_at', label: 'Received', render: (row) => formatDate(row.created_at) },
    {
      key: 'actions',
      label: '',
      className: 'text-end',
      render: (row) =>
        !(row.read_at || row.is_read) ? (
          <button type="button" className="btn btn-sm btn-outline-brand" onClick={() => markRead(row)}>
            Mark read
          </button>
        ) : null,
    },
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Contact messages</h1>
          <p className="text-secondary mb-0">Inbound site inquiries</p>
        </div>
      </div>
      {error ? <Alert type="danger" message={error} /> : null}
      <div className="panel">
        <DataTable columns={columns} rows={rows} loading={loading} />
        <Pagination meta={meta} onPageChange={setPage} />
      </div>
    </>
  )
}
