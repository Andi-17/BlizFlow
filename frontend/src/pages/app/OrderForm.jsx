import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import FormField from '../../components/FormField'
import Alert from '../../components/Alert'
import LoadingSpinner from '../../components/LoadingSpinner'
import { orderService } from '../../services/orderService'
import { customerService } from '../../services/customerService'
import { productService } from '../../services/productService'
import { useAlert } from '../../hooks/useAlert'
import { firstValidationError, getErrorMessage, getValidationErrors, unwrapList } from '../../utils/formatters'

const blankItem = () => ({ product_id: '', quantity: 1, unit_price: '', name: '' })

export default function OrderForm() {
  const navigate = useNavigate()
  const { success } = useAlert()
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({
    customer_id: '',
    status: 'pending',
    discount: 0,
    tax: 0,
    notes: '',
    ordered_at: '',
    items: [blankItem()],
  })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const [customerRes, productRes] = await Promise.all([
          customerService.list({ per_page: 100 }),
          productService.list({ per_page: 100 }),
        ])
        if (!active) return
        setCustomers(unwrapList(customerRes.data).items)
        setProducts(unwrapList(productRes.data).items)
      } catch (err) {
        if (active) setError(getErrorMessage(err))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const updateItem = (index, field, value) => {
    setForm((current) => {
      const items = current.items.map((item, itemIndex) => {
        if (itemIndex !== index) return item
        const next = { ...item, [field]: value }
        if (field === 'product_id') {
          const product = products.find((entry) => String(entry.id) === String(value))
          if (product) {
            next.name = product.name
            next.unit_price = product.price
            next.sku = product.sku
          }
        }
        return next
      })
      return { ...current, items }
    })
  }

  const addItem = () => setForm((current) => ({ ...current, items: [...current.items, blankItem()] }))
  const removeItem = (index) =>
    setForm((current) => ({
      ...current,
      items: current.items.length === 1 ? current.items : current.items.filter((_, itemIndex) => itemIndex !== index),
    }))

  const onSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    setError(null)
    const payload = {
      customer_id: Number(form.customer_id),
      status: form.status || undefined,
      discount: Number(form.discount || 0),
      tax: Number(form.tax || 0),
      notes: form.notes || undefined,
      ordered_at: form.ordered_at || undefined,
      items: form.items.map((item) => ({
        product_id: item.product_id ? Number(item.product_id) : null,
        name: item.name || undefined,
        quantity: Number(item.quantity),
        unit_price: item.unit_price === '' ? undefined : Number(item.unit_price),
      })),
    }
    try {
      const response = await orderService.create(payload)
      success(response.message || 'Order created')
      navigate(`/app/orders/${response.data?.id}`)
    } catch (err) {
      setErrors(getValidationErrors(err))
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <>
      <div className="page-header">
        <div>
          <h1>New order</h1>
          <p className="text-secondary mb-0">Totals are calculated by the server</p>
        </div>
        <Link to="/app/orders" className="btn btn-outline-brand">
          Back
        </Link>
      </div>
      {error ? <Alert type="danger" message={error} /> : null}
      <form className="panel" onSubmit={onSubmit}>
        <div className="row">
          <div className="col-md-6">
            <FormField
              label="Customer"
              name="customer_id"
              as="select"
              value={form.customer_id}
              onChange={onChange}
              required
              error={firstValidationError(errors, 'customer_id')}
              options={[
                { value: '', label: 'Select customer' },
                ...customers.map((customer) => ({ value: customer.id, label: customer.name })),
              ]}
            />
          </div>
          <div className="col-md-3">
            <FormField label="Status" name="status" value={form.status} onChange={onChange} error={firstValidationError(errors, 'status')} />
          </div>
          <div className="col-md-3">
            <FormField label="Ordered at" name="ordered_at" type="date" value={form.ordered_at} onChange={onChange} error={firstValidationError(errors, 'ordered_at')} />
          </div>
          <div className="col-md-3">
            <FormField label="Discount" name="discount" type="number" step="0.01" value={form.discount} onChange={onChange} error={firstValidationError(errors, 'discount')} />
          </div>
          <div className="col-md-3">
            <FormField label="Tax" name="tax" type="number" step="0.01" value={form.tax} onChange={onChange} error={firstValidationError(errors, 'tax')} />
          </div>
          <div className="col-12">
            <FormField label="Notes" name="notes" as="textarea" rows={2} value={form.notes} onChange={onChange} error={firstValidationError(errors, 'notes')} />
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-2">
          <h2 className="h5 mb-0">Line items</h2>
          <button type="button" className="btn btn-sm btn-outline-brand" onClick={addItem}>
            Add line
          </button>
        </div>
        {firstValidationError(errors, 'items') ? (
          <div className="text-danger small mb-2">{firstValidationError(errors, 'items')}</div>
        ) : null}
        <div className="table-responsive line-items-table mb-3">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit price</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {form.items.map((item, index) => (
                <tr key={`item-${index}`}>
                  <td>
                    <select
                      className="form-select"
                      value={item.product_id}
                      onChange={(event) => updateItem(index, 'product_id', event.target.value)}
                    >
                      <option value="">Custom / select</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={item.quantity}
                      onChange={(event) => updateItem(index, 'quantity', event.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={item.unit_price}
                      onChange={(event) => updateItem(index, 'unit_price', event.target.value)}
                    />
                  </td>
                  <td className="text-end">
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeItem(index)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="submit" className="btn btn-brand" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create order'}
        </button>
      </form>
    </>
  )
}
