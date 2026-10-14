import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import FormField from '../../components/FormField'
import Alert from '../../components/Alert'
import LoadingSpinner from '../../components/LoadingSpinner'
import { productService } from '../../services/productService'
import { useAlert } from '../../hooks/useAlert'
import { firstValidationError, getErrorMessage, getValidationErrors, unwrapList } from '../../utils/formatters'

const empty = {
  name: '',
  sku: '',
  description: '',
  category_id: '',
  price: '',
  cost: '',
  stock_quantity: 0,
  min_stock_level: 0,
  is_active: true,
}

export default function ProductForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { success } = useAlert()
  const [form, setForm] = useState(empty)
  const [categories, setCategories] = useState([])
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const catResponse = await productService.listCategories({ per_page: 100 })
        if (active) setCategories(unwrapList(catResponse.data).items)
        if (isEdit) {
          const response = await productService.show(id)
          if (active) {
            setForm({
              ...empty,
              ...response.data,
              category_id: response.data.category_id ?? '',
              price: response.data.price ?? '',
              cost: response.data.cost ?? '',
            })
          }
        }
      } catch (err) {
        if (active) setError(getErrorMessage(err))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [id, isEdit])

  const onChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    setError(null)
    const payload = {
      ...form,
      category_id: form.category_id || null,
      price: Number(form.price),
      cost: form.cost === '' ? null : Number(form.cost),
      stock_quantity: Number(form.stock_quantity || 0),
      min_stock_level: Number(form.min_stock_level || 0),
      is_active: Boolean(form.is_active),
    }
    try {
      const response = isEdit
        ? await productService.update(id, payload)
        : await productService.create(payload)
      success(response.message || 'Product saved')
      navigate('/app/products')
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
          <h1>{isEdit ? 'Edit product' : 'New product'}</h1>
        </div>
        <Link to="/app/products" className="btn btn-outline-brand">
          Back
        </Link>
      </div>
      {error ? <Alert type="danger" message={error} /> : null}
      <form className="panel" onSubmit={onSubmit} style={{ maxWidth: 760 }}>
        <div className="row">
          <div className="col-md-8">
            <FormField label="Name" name="name" value={form.name} onChange={onChange} required error={firstValidationError(errors, 'name')} />
          </div>
          <div className="col-md-4">
            <FormField label="SKU" name="sku" value={form.sku} onChange={onChange} required error={firstValidationError(errors, 'sku')} />
          </div>
          <div className="col-md-6">
            <FormField
              label="Category"
              name="category_id"
              as="select"
              value={form.category_id}
              onChange={onChange}
              error={firstValidationError(errors, 'category_id')}
              options={[
                { value: '', label: 'No category' },
                ...categories.map((category) => ({ value: category.id, label: category.name })),
              ]}
            />
          </div>
          <div className="col-md-3">
            <FormField label="Price" name="price" type="number" step="0.01" value={form.price} onChange={onChange} required error={firstValidationError(errors, 'price')} />
          </div>
          <div className="col-md-3">
            <FormField label="Cost" name="cost" type="number" step="0.01" value={form.cost} onChange={onChange} error={firstValidationError(errors, 'cost')} />
          </div>
          <div className="col-md-3">
            <FormField label="Stock" name="stock_quantity" type="number" value={form.stock_quantity} onChange={onChange} error={firstValidationError(errors, 'stock_quantity')} />
          </div>
          <div className="col-md-3">
            <FormField label="Min stock" name="min_stock_level" type="number" value={form.min_stock_level} onChange={onChange} error={firstValidationError(errors, 'min_stock_level')} />
          </div>
          <div className="col-12">
            <FormField label="Description" name="description" as="textarea" rows={3} value={form.description || ''} onChange={onChange} error={firstValidationError(errors, 'description')} />
          </div>
          <div className="col-12">
            <div className="form-check mb-3">
              <input className="form-check-input" type="checkbox" id="is_active" name="is_active" checked={Boolean(form.is_active)} onChange={onChange} />
              <label className="form-check-label" htmlFor="is_active">
                Active
              </label>
            </div>
          </div>
        </div>
        <button type="submit" className="btn btn-brand" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save product'}
        </button>
      </form>
    </>
  )
}
