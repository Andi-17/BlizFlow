import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DataTable from '../../components/DataTable'
import Pagination from '../../components/Pagination'
import SearchFilter from '../../components/SearchFilter'
import Modal from '../../components/Modal'
import Alert from '../../components/Alert'
import { orderService } from '../../services/orderService'
import { usePagination } from '../../hooks/usePagination'
import { useAlert } from '../../hooks/useAlert'
import { useIndustry } from '../../hooks/useIndustry'
import { formatCurrency, formatDate, getErrorMessage, unwrapList } from '../../utils/formatters'

export default function Orders() {
  const navigate = useNavigate()
  const { label } = useIndustry()
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
      const response = await orderService.list(params)
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
      await orderService.remove(deleteTarget.id)
      success('Order deleted')
      setDeleteTarget(null)
      load()
    } catch (err) {
      showError(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    { key: 'order_number', label: 'Order', render: (row) => <strong>{row.order_number}</strong> },
    { key: 'customer', label: 'Customer', render: (row) => row.customer?.name || `#${row.customer_id}` },
    { key: 'status', label: 'Status', render: (row) => <span className="badge badge-soft text-capitalize">{row.status}</span> },
    { key: 'total', label: 'Total', render: (row) => formatCurrency(row.total) },
    { key: 'ordered_at', label: 'Date', render: (row) => formatDate(row.ordered_at || row.created_at) },
    {
      key: 'actions',
      label: '',
      className: 'text-end',
      render: (row) => (
        <div className="btn-group btn-group-sm" onClick={(event) => event.stopPropagation()}>
          <Link to={`/app/orders/${row.id}`} className="btn btn-outline-brand">
            View
          </Link>
          <button type="button" className="btn btn-outline-danger" onClick={() => setDeleteTarget(row)}>
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{label('orders')}</h1>
          <p className="text-secondary mb-0">Sales {label('orders').toLowerCase()} with line items</p>
        </div>
        <Link to="/app/orders/new" className="btn btn-brand">
          New order
        </Link>
      </div>
      {error ? <Alert type="danger" message={error} /> : null}
      <div className="panel">
        <SearchFilter value={search} onSearch={applySearch} placeholder={`Search ${label('orders').toLowerCase()}…`} />
        <DataTable columns={columns} rows={rows} loading={loading} onRowClick={(row) => navigate(`/app/orders/${row.id}`)} />
        <Pagination meta={meta} onPageChange={setPage} />
      </div>
      <Modal
        show={Boolean(deleteTarget)}
        title="Delete order"
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <button type="button" className="btn btn-outline-brand" onClick={() => setDeleteTarget(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" disabled={deleting} onClick={confirmDelete}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <p className="mb-0">
          Delete order <strong>{deleteTarget?.order_number}</strong>?
        </p>
      </Modal>
    </>
  )
}
