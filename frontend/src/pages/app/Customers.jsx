import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DataTable from '../../components/DataTable'
import Pagination from '../../components/Pagination'
import SearchFilter from '../../components/SearchFilter'
import Modal from '../../components/Modal'
import Alert from '../../components/Alert'
import { customerService } from '../../services/customerService'
import { usePagination } from '../../hooks/usePagination'
import { useAlert } from '../../hooks/useAlert'
import { useIndustry } from '../../hooks/useIndustry'
import { useLocale } from '../../hooks/useLocale'
import { downloadCsv } from '../../utils/businessExtras'
import { formatDate, getErrorMessage, unwrapList } from '../../utils/formatters'

export default function Customers() {
  const navigate = useNavigate()
  const { label } = useIndustry()
  const { t } = useLocale()
  const { success, error: showError } = useAlert()
  const { page, setPage, search, applySearch, meta, setMeta, params } = usePagination()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await customerService.list(params)
      const { items, meta: nextMeta } = unwrapList(response.data)
      setRows(items)
      setMeta(nextMeta)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    load()
  }, [load])

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await customerService.remove(deleteTarget.id)
      success('Customer deleted')
      setDeleteTarget(null)
      load()
    } catch (err) {
      showError(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const exportCsv = () => {
    downloadCsv(
      `customers-${new Date().toISOString().slice(0, 10)}.csv`,
      rows,
      [
        { label: 'Name', value: (row) => row.name },
        { label: 'Email', value: (row) => row.email || '' },
        { label: 'Company', value: (row) => row.company_name || '' },
        { label: 'Phone', value: (row) => row.phone || '' },
        { label: 'Created', value: (row) => row.created_at || '' },
      ],
    )
  }

  const columns = [
    { key: 'name', label: 'Name', render: (row) => <strong>{row.name}</strong> },
    { key: 'email', label: 'Email', render: (row) => row.email || '—' },
    { key: 'company_name', label: 'Company', render: (row) => row.company_name || '—' },
    { key: 'phone', label: 'Phone', render: (row) => row.phone || '—' },
    { key: 'created_at', label: 'Created', render: (row) => formatDate(row.created_at) },
    {
      key: 'actions',
      label: '',
      className: 'text-end',
      render: (row) => (
        <div className="btn-group btn-group-sm" onClick={(event) => event.stopPropagation()}>
          <Link to={`/app/customers/${row.id}`} className="btn btn-outline-brand">View</Link>
          <Link to={`/app/customers/${row.id}/edit`} className="btn btn-outline-brand">Edit</Link>
          <button type="button" className="btn btn-outline-danger" onClick={() => setDeleteTarget(row)}>Delete</button>
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{label('customers')}</h1>
          <p className="text-secondary mb-0">Manage your {label('customers').toLowerCase()} book</p>
        </div>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-outline-brand" onClick={exportCsv} disabled={!rows.length}>
            {t('app.exportCsv')}
          </button>
          <Link to="/app/customers/new" className="btn btn-brand">Add customer</Link>
        </div>
      </div>
      {error ? <Alert type="danger" message={error} /> : null}
      <div className="panel">
        <SearchFilter value={search} onSearch={applySearch} placeholder="Search name, email, company…" />
        <DataTable columns={columns} rows={rows} loading={loading} onRowClick={(row) => navigate(`/app/customers/${row.id}`)} />
        <Pagination meta={meta} onPageChange={setPage} />
      </div>
      <Modal
        show={Boolean(deleteTarget)}
        title="Delete customer"
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <button type="button" className="btn btn-outline-brand" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button type="button" className="btn btn-danger" disabled={deleting} onClick={confirmDelete}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <p className="mb-0">Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.</p>
      </Modal>
    </>
  )
}
