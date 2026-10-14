import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DataTable from '../../components/DataTable'
import Pagination from '../../components/Pagination'
import SearchFilter from '../../components/SearchFilter'
import Modal from '../../components/Modal'
import Alert from '../../components/Alert'
import { invoiceService } from '../../services/invoiceService'
import { usePagination } from '../../hooks/usePagination'
import { useAlert } from '../../hooks/useAlert'
import { useIndustry } from '../../hooks/useIndustry'
import { formatCurrency, formatDate, getErrorMessage, unwrapList } from '../../utils/formatters'

export default function Invoices() {
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
      const response = await invoiceService.list(params)
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
      await invoiceService.remove(deleteTarget.id)
      success('Invoice deleted')
      setDeleteTarget(null)
      load()
    } catch (err) {
      showError(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const downloadPdf = async (row) => {
    try {
      await invoiceService.downloadPdf(row.id, row.invoice_number ? `${row.invoice_number}.pdf` : null)
      success('PDF downloaded')
    } catch (err) {
      showError(getErrorMessage(err, 'PDF download failed'))
    }
  }

  const columns = [
    { key: 'invoice_number', label: 'Invoice', render: (row) => <strong>{row.invoice_number}</strong> },
    { key: 'customer', label: 'Customer', render: (row) => row.customer?.name || `#${row.customer_id}` },
    { key: 'status', label: 'Status', render: (row) => <span className="badge badge-soft text-capitalize">{row.status}</span> },
    { key: 'total', label: 'Total', render: (row) => formatCurrency(row.total) },
    { key: 'due_date', label: 'Due', render: (row) => formatDate(row.due_date) },
    {
      key: 'actions',
      label: '',
      className: 'text-end',
      render: (row) => (
        <div className="btn-group btn-group-sm" onClick={(event) => event.stopPropagation()}>
          <Link to={`/app/invoices/${row.id}`} className="btn btn-outline-brand">
            View
          </Link>
          <button type="button" className="btn btn-outline-brand" onClick={() => downloadPdf(row)}>
            PDF
          </button>
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
          <h1>{label('invoices')}</h1>
          <p className="text-secondary mb-0">Billing documents</p>
        </div>
        <Link to="/app/invoices/new" className="btn btn-brand">
          New invoice
        </Link>
      </div>
      {error ? <Alert type="danger" message={error} /> : null}
      <div className="panel">
        <SearchFilter value={search} onSearch={applySearch} placeholder={`Search ${label('invoices').toLowerCase()}…`} />
        <DataTable columns={columns} rows={rows} loading={loading} onRowClick={(row) => navigate(`/app/invoices/${row.id}`)} />
        <Pagination meta={meta} onPageChange={setPage} />
      </div>
      <Modal
        show={Boolean(deleteTarget)}
        title="Delete invoice"
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
          Delete invoice <strong>{deleteTarget?.invoice_number}</strong>?
        </p>
      </Modal>
    </>
  )
}
