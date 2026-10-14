import { useCallback, useEffect, useState } from 'react'
import DataTable from '../../components/DataTable'
import Pagination from '../../components/Pagination'
import Alert from '../../components/Alert'
import { adminService } from '../../services/adminService'
import { usePagination } from '../../hooks/usePagination'
import { useAlert } from '../../hooks/useAlert'
import { formatDate, getErrorMessage, unwrapList } from '../../utils/formatters'

export default function AdminUsers() {
  const { success, error: showError } = useAlert()
  const { page, setPage, meta, setMeta, params } = usePagination()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await adminService.users(params)
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

  const toggleActive = async (row) => {
    try {
      await adminService.updateUser(row.id, { is_active: !row.is_active })
      success('User updated')
      load()
    } catch (err) {
      showError(getErrorMessage(err))
    }
  }

  const columns = [
    { key: 'name', label: 'Name', render: (row) => <strong>{row.name}</strong> },
    { key: 'email', label: 'Email' },
    {
      key: 'is_platform_admin',
      label: 'Admin',
      render: (row) => (row.is_platform_admin ? <span className="badge badge-amber">Yes</span> : '—'),
    },
    {
      key: 'is_active',
      label: 'Active',
      render: (row) => (row.is_active ? <span className="badge badge-soft">Active</span> : <span className="badge text-bg-secondary">Inactive</span>),
    },
    { key: 'created_at', label: 'Joined', render: (row) => formatDate(row.created_at) },
    {
      key: 'actions',
      label: '',
      className: 'text-end',
      render: (row) => (
        <button type="button" className="btn btn-sm btn-outline-brand" onClick={() => toggleActive(row)}>
          {row.is_active ? 'Deactivate' : 'Activate'}
        </button>
      ),
    },
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p className="text-secondary mb-0">Platform accounts</p>
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
