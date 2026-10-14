import { useCallback, useEffect, useState } from 'react'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import Alert from '../../components/Alert'
import { adminService } from '../../services/adminService'
import { useAlert } from '../../hooks/useAlert'
import { firstValidationError, formatCurrency, getErrorMessage, getValidationErrors, unwrapList } from '../../utils/formatters'

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  interval: 'monthly',
  price: '',
  currency: 'EUR',
  features: '',
  is_active: true,
  trial_days: 0,
  sort_order: 0,
}

export default function AdminPlans() {
  const { success, error: showError } = useAlert()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await adminService.plans()
      setRows(unwrapList(response.data).items)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setShowForm(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({
      name: row.name || '',
      slug: row.slug || '',
      description: row.description || '',
      interval: row.interval || 'monthly',
      price: row.price ?? '',
      currency: row.currency || 'EUR',
      features: Array.isArray(row.features) ? row.features.join('\n') : '',
      is_active: Boolean(row.is_active),
      trial_days: row.trial_days ?? 0,
      sort_order: row.sort_order ?? 0,
    })
    setErrors({})
    setShowForm(true)
  }

  const onChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    const payload = {
      ...form,
      price: Number(form.price),
      trial_days: Number(form.trial_days || 0),
      sort_order: Number(form.sort_order || 0),
      features: form.features
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    }
    try {
      if (editing) {
        await adminService.updatePlan(editing.id, payload)
        success('Plan updated')
      } else {
        await adminService.createPlan(payload)
        success('Plan created')
      }
      setShowForm(false)
      load()
    } catch (err) {
      setErrors(getValidationErrors(err))
      showError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: 'name', label: 'Plan', render: (row) => <strong>{row.name}</strong> },
    { key: 'slug', label: 'Slug' },
    { key: 'interval', label: 'Interval' },
    { key: 'price', label: 'Price', render: (row) => formatCurrency(row.price, row.currency || 'EUR') },
    {
      key: 'is_active',
      label: 'Active',
      render: (row) => (row.is_active ? <span className="badge badge-soft">Yes</span> : 'No'),
    },
    {
      key: 'actions',
      label: '',
      className: 'text-end',
      render: (row) => (
        <button type="button" className="btn btn-sm btn-outline-brand" onClick={() => openEdit(row)}>
          Edit
        </button>
      ),
    },
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Plans</h1>
          <p className="text-secondary mb-0">Subscription catalog</p>
        </div>
        <button type="button" className="btn btn-brand" onClick={openCreate}>
          Add plan
        </button>
      </div>
      {error ? <Alert type="danger" message={error} /> : null}
      <div className="panel">
        <DataTable columns={columns} rows={rows} loading={loading} />
      </div>
      <Modal
        show={showForm}
        title={editing ? 'Edit plan' : 'New plan'}
        size="modal-lg"
        onClose={() => setShowForm(false)}
        footer={
          <>
            <button type="button" className="btn btn-outline-brand" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" form="plan-form" className="btn btn-brand" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <form id="plan-form" onSubmit={onSubmit}>
          <div className="row">
            <div className="col-md-6">
              <FormField label="Name" name="name" value={form.name} onChange={onChange} required error={firstValidationError(errors, 'name')} />
            </div>
            <div className="col-md-6">
              <FormField label="Slug" name="slug" value={form.slug} onChange={onChange} required error={firstValidationError(errors, 'slug')} />
            </div>
            <div className="col-md-4">
              <FormField label="Interval" name="interval" value={form.interval} onChange={onChange} error={firstValidationError(errors, 'interval')} />
            </div>
            <div className="col-md-4">
              <FormField label="Price" name="price" type="number" step="0.01" value={form.price} onChange={onChange} required error={firstValidationError(errors, 'price')} />
            </div>
            <div className="col-md-4">
              <FormField label="Currency" name="currency" value={form.currency} onChange={onChange} error={firstValidationError(errors, 'currency')} />
            </div>
            <div className="col-12">
              <FormField label="Description" name="description" as="textarea" rows={2} value={form.description} onChange={onChange} error={firstValidationError(errors, 'description')} />
            </div>
            <div className="col-12">
              <FormField label="Features (one per line)" name="features" as="textarea" rows={4} value={form.features} onChange={onChange} error={firstValidationError(errors, 'features')} />
            </div>
            <div className="col-md-4">
              <FormField label="Trial days" name="trial_days" type="number" value={form.trial_days} onChange={onChange} error={firstValidationError(errors, 'trial_days')} />
            </div>
            <div className="col-md-4">
              <FormField label="Sort order" name="sort_order" type="number" value={form.sort_order} onChange={onChange} error={firstValidationError(errors, 'sort_order')} />
            </div>
            <div className="col-md-4 d-flex align-items-center">
              <div className="form-check mt-3">
                <input className="form-check-input" type="checkbox" id="is_active" name="is_active" checked={Boolean(form.is_active)} onChange={onChange} />
                <label className="form-check-label" htmlFor="is_active">
                  Active
                </label>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </>
  )
}
