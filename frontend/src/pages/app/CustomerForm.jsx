import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import FormField from '../../components/FormField'
import Alert from '../../components/Alert'
import LoadingSpinner from '../../components/LoadingSpinner'
import { customerService } from '../../services/customerService'
import { useAlert } from '../../hooks/useAlert'
import { firstValidationError, getErrorMessage, getValidationErrors } from '../../utils/formatters'

const empty = {
  name: '',
  email: '',
  phone: '',
  company_name: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
  notes: '',
}

export default function CustomerForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { success } = useAlert()
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    let active = true
    ;(async () => {
      try {
        const response = await customerService.show(id)
        if (active) setForm({ ...empty, ...response.data })
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
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    setError(null)
    try {
      const response = isEdit
        ? await customerService.update(id, form)
        : await customerService.create(form)
      success(response.message || (isEdit ? 'Customer updated' : 'Customer created'))
      navigate(`/app/customers/${response.data?.id || id}`)
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
          <h1>{isEdit ? 'Edit customer' : 'New customer'}</h1>
          <p className="text-secondary mb-0">Customer profile details</p>
        </div>
        <Link to="/app/customers" className="btn btn-outline-brand">Back</Link>
      </div>
      {error ? <Alert type="danger" message={error} /> : null}
      <form className="panel" onSubmit={onSubmit} style={{ maxWidth: 760 }}>
        <div className="row">
          <div className="col-md-6">
            <FormField label="Name" name="name" value={form.name} onChange={onChange} required error={firstValidationError(errors, 'name')} />
          </div>
          <div className="col-md-6">
            <FormField label="Email" name="email" type="email" value={form.email || ''} onChange={onChange} error={firstValidationError(errors, 'email')} />
          </div>
          <div className="col-md-6">
            <FormField label="Phone" name="phone" value={form.phone || ''} onChange={onChange} error={firstValidationError(errors, 'phone')} />
          </div>
          <div className="col-md-6">
            <FormField label="Company name" name="company_name" value={form.company_name || ''} onChange={onChange} error={firstValidationError(errors, 'company_name')} />
          </div>
          <div className="col-12">
            <FormField label="Address line 1" name="address_line1" value={form.address_line1 || ''} onChange={onChange} error={firstValidationError(errors, 'address_line1')} />
          </div>
          <div className="col-12">
            <FormField label="Address line 2" name="address_line2" value={form.address_line2 || ''} onChange={onChange} error={firstValidationError(errors, 'address_line2')} />
          </div>
          <div className="col-md-4">
            <FormField label="City" name="city" value={form.city || ''} onChange={onChange} error={firstValidationError(errors, 'city')} />
          </div>
          <div className="col-md-4">
            <FormField label="State" name="state" value={form.state || ''} onChange={onChange} error={firstValidationError(errors, 'state')} />
          </div>
          <div className="col-md-4">
            <FormField label="Postal code" name="postal_code" value={form.postal_code || ''} onChange={onChange} error={firstValidationError(errors, 'postal_code')} />
          </div>
          <div className="col-md-6">
            <FormField label="Country" name="country" value={form.country || ''} onChange={onChange} error={firstValidationError(errors, 'country')} />
          </div>
          <div className="col-12">
            <FormField label="Notes" name="notes" as="textarea" rows={3} value={form.notes || ''} onChange={onChange} error={firstValidationError(errors, 'notes')} />
          </div>
        </div>
        <button type="submit" className="btn btn-brand" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save customer'}
        </button>
      </form>
    </>
  )
}
