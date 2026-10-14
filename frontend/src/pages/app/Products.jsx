import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DataTable from '../../components/DataTable'
import Pagination from '../../components/Pagination'
import SearchFilter from '../../components/SearchFilter'
import Modal from '../../components/Modal'
import Alert from '../../components/Alert'
import { productService } from '../../services/productService'
import { usePagination } from '../../hooks/usePagination'
import { useAlert } from '../../hooks/useAlert'
import { useIndustry } from '../../hooks/useIndustry'
import { formatCurrency, getErrorMessage, unwrapList } from '../../utils/formatters'

export default function Products() {
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
      const response = await productService.list(params)
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
      await productService.remove(deleteTarget.id)
      success('Product deleted')
      setDeleteTarget(null)
      load()
    } catch (err) {
      showError(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    { key: 'name', label: 'Product', render: (row) => <strong>{row.name}</strong> },
    { key: 'sku', label: 'SKU' },
    { key: 'price', label: 'Price', render: (row) => formatCurrency(row.price) },
    { key: 'stock_quantity', label: 'Stock' },
    {
      key: 'is_active',
      label: 'Status',
      render: (row) => (
        <span className={`badge ${row.is_active ? 'badge-soft' : 'text-bg-secondary'}`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'text-end',
      render: (row) => (
        <div className="btn-group btn-group-sm">
          <Link to={`/app/products/${row.id}/edit`} className="btn btn-outline-brand">
            Edit
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
          <h1>{label('products')}</h1>
          <p className="text-secondary mb-0">Catalog and pricing</p>
        </div>
        <Link to="/app/products/new" className="btn btn-brand">
          Add product
        </Link>
      </div>
      {error ? <Alert type="danger" message={error} /> : null}
      <div className="panel">
        <SearchFilter value={search} onSearch={applySearch} placeholder={`Search ${label('products').toLowerCase()}…`} />
        <DataTable columns={columns} rows={rows} loading={loading} />
        <Pagination meta={meta} onPageChange={setPage} />
      </div>
      <Modal
        show={Boolean(deleteTarget)}
        title="Delete product"
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
          Delete <strong>{deleteTarget?.name}</strong>?
        </p>
      </Modal>
    </>
  )
}
