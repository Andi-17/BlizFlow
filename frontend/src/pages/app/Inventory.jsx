import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import DataTable from '../../components/DataTable'
import Pagination from '../../components/Pagination'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import Alert from '../../components/Alert'
import { productService } from '../../services/productService'
import { usePagination } from '../../hooks/usePagination'
import { useAlert } from '../../hooks/useAlert'
import { useIndustry } from '../../hooks/useIndustry'
import { formatCurrency, getErrorMessage, unwrapList } from '../../utils/formatters'

export default function Inventory() {
  const { label } = useIndustry()
  const { success, error: showError } = useAlert()
  const { page, setPage, meta, setMeta, params } = usePagination(1, 50)
  const [searchParams, setSearchParams] = useSearchParams()
  const [summary, setSummary] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [stockQuantity, setStockQuantity] = useState(0)
  const [minStock, setMinStock] = useState(0)
  const [saving, setSaving] = useState(false)
  const [lowOnly, setLowOnly] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await productService.inventory({
        ...params,
        low_stock_only: lowOnly || undefined,
        search: searchParams.get('q') || undefined,
      })
      setSummary(response.data?.summary || null)
      const productsPayload = response.data?.products
      const { items, meta: nextMeta } = unwrapList(productsPayload)
      setRows(items)
      setMeta(nextMeta)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page, lowOnly, searchParams])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const productId = searchParams.get('product')
    const addQty = Number(searchParams.get('add') || 0)
    if (!productId) return undefined

    let active = true
    ;(async () => {
      const fromRows = rows.find((item) => String(item.id) === String(productId))
      let row = fromRows
      if (!row) {
        try {
          const response = await productService.show(productId)
          row = response.data
        } catch {
          return
        }
      }
      if (!active || !row) return

      setEditItem(row)
      setStockQuantity(Number(row.stock_quantity || 0) + (addQty > 0 ? addQty : 0))
      setMinStock(row.min_stock_level ?? 0)

      const next = new URLSearchParams(searchParams)
      next.delete('product')
      next.delete('add')
      setSearchParams(next, { replace: true })
    })()

    return () => {
      active = false
    }
  }, [rows, searchParams, setSearchParams])

  const openEdit = (row) => {
    setEditItem(row)
    setStockQuantity(row.stock_quantity ?? 0)
    setMinStock(row.min_stock_level ?? 0)
  }

  const save = async () => {
    if (!editItem) return
    setSaving(true)
    try {
      await productService.adjustInventory(editItem.id, {
        stock_quantity: Number(stockQuantity),
        min_stock_level: Number(minStock),
      })
      success('Inventory updated')
      setEditItem(null)
      load()
    } catch (err) {
      showError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'name', label: 'Product', render: (row) => <strong>{row.name}</strong> },
    { key: 'sku', label: 'SKU' },
    { key: 'stock_quantity', label: 'Stock' },
    { key: 'min_stock_level', label: 'Min' },
    { key: 'price', label: 'Price', render: (row) => formatCurrency(row.price) },
    {
      key: 'status',
      label: 'Status',
      render: (row) =>
        row.stock_quantity <= row.min_stock_level ? (
          <span className="badge badge-amber">Low</span>
        ) : (
          <span className="badge badge-soft">OK</span>
        ),
    },
    {
      key: 'actions',
      label: '',
      className: 'text-end',
      render: (row) => (
        <button type="button" className="btn btn-sm btn-outline-brand" onClick={() => openEdit(row)}>
          Adjust
        </button>
      ),
    },
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{label('inventory')}</h1>
          <p className="text-secondary mb-0">Stock levels and adjustments</p>
        </div>
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            id="lowOnly"
            checked={lowOnly}
            onChange={(event) => {
              setPage(1)
              setLowOnly(event.target.checked)
            }}
          />
          <label className="form-check-label" htmlFor="lowOnly">
            Low stock only
          </label>
        </div>
      </div>
      {error ? <Alert type="danger" message={error} /> : null}
      {summary ? (
        <div className="row g-3 mb-3">
          <div className="col-md-4">
            <div className="panel">
              <div className="small text-secondary">Total SKUs</div>
              <strong className="fs-4">{summary.total_skus}</strong>
            </div>
          </div>
          <div className="col-md-4">
            <div className="panel">
              <div className="small text-secondary">Low stock</div>
              <strong className="fs-4">{summary.low_stock_count}</strong>
            </div>
          </div>
          <div className="col-md-4">
            <div className="panel">
              <div className="small text-secondary">Out of stock</div>
              <strong className="fs-4">{summary.out_of_stock_count}</strong>
            </div>
          </div>
        </div>
      ) : null}
      <div className="panel">
        <DataTable columns={columns} rows={rows} loading={loading} emptyTitle={`No ${label('inventory').toLowerCase()} items`} />
        <Pagination meta={meta} onPageChange={setPage} />
      </div>
      <Modal
        show={Boolean(editItem)}
        title={`Adjust ${editItem?.name || ''}`}
        onClose={() => setEditItem(null)}
        footer={
          <>
            <button type="button" className="btn btn-outline-brand" onClick={() => setEditItem(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-brand" disabled={saving} onClick={save}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <FormField label="Stock quantity" name="stock_quantity" type="number" value={stockQuantity} onChange={(event) => setStockQuantity(event.target.value)} />
        <FormField label="Min stock level" name="min_stock_level" type="number" value={minStock} onChange={(event) => setMinStock(event.target.value)} />
      </Modal>
    </>
  )
}
