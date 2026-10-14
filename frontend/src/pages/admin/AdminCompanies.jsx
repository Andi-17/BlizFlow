import { useCallback, useEffect, useState } from 'react'
import DataTable from '../../components/DataTable'
import Pagination from '../../components/Pagination'
import Alert from '../../components/Alert'
import { adminService } from '../../services/adminService'
import { usePagination } from '../../hooks/usePagination'
import { useAlert } from '../../hooks/useAlert'
import { formatDate, getErrorMessage, unwrapList } from '../../utils/formatters'

export default function AdminCompanies() {
  const { success, error: showError } = useAlert()
  const { page, setPage, meta, setMeta, params } = usePagination()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await adminService.companies(params)
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
      await adminService.updateCompany(row.id, { is_active: !row.is_active })
      success('Company updated')
      load()
    } catch (err) {
      showError(getErrorMessage(err))
    }
  }

  const planLabel = (row) => {
    const subscription = row.subscription
    const name = subscription?.plan?.name || '—'
    if (subscription?.is_complimentary) {
      return (
        <span>
          {name} <span className="badge badge-amber">Gift</span>
        </span>
      )
    }
    if (subscription?.is_trialing) {
      return (
        <span>
          {name} <span className="badge badge-soft">Trial</span>
        </span>
      )
    }
    return name
  }

  const columns = [
    { key: 'name', label: 'Company', render: (row) => <strong>{row.name}</strong> },
    { key: 'email', label: 'Email', render: (row) => row.email || '—' },
    { key: 'plan', label: 'Plan', render: planLabel },
    {
      key: 'is_active',
      label: 'Status',
      render: (row) => (row.is_active ? <span className="badge badge-soft">Active</span> : <span className="badge text-bg-secondary">Inactive</span>),
    },
    { key: 'created_at', label: 'Created', render: (row) => formatDate(row.created_at) },
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
          <h1>Companies</h1>
          <p className="text-secondary mb-0">Tenant workspaces</p>
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
