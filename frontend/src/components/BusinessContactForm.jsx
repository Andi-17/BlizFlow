import { useState } from 'react'
import Alert from './Alert'
import FormField from './FormField'
import { publicCompanyService } from '../services/publicCompanyService'
import { firstValidationError, getErrorMessage, getValidationErrors } from '../utils/formatters'
import { useLocale } from '../hooks/useLocale'

const emptyForm = {
  name: '',
  email: '',
  subject: '',
  message: '',
}

export default function BusinessContactForm({ slug, businessName }) {
  const { t } = useLocale()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setErrors({})
    setSuccessMessage(null)
    try {
      const response = await publicCompanyService.contact(slug, {
        name: form.name,
        email: form.email,
        subject: form.subject || undefined,
        message: form.message,
      })
      setSuccessMessage(response.message || t('business.contactSent'))
      setForm(emptyForm)
    } catch (err) {
      setErrors(getValidationErrors(err))
      setError(getErrorMessage(err, t('business.contactFailed')))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="biz-contact-form" onSubmit={onSubmit}>
      <h3 className="biz-contact-form__title">{t('business.contactFormTitle')}</h3>
      <p className="biz-contact-form__lede">
        {t('business.contactFormLede', { name: businessName })}
      </p>
      {error ? <Alert type="danger" message={error} /> : null}
      {successMessage ? <Alert type="success" message={successMessage} /> : null}
      <div className="row">
        <div className="col-md-6">
          <FormField
            label={t('business.yourName')}
            name="name"
            value={form.name}
            onChange={onChange}
            required
            error={firstValidationError(errors, 'name')}
          />
        </div>
        <div className="col-md-6">
          <FormField
            label={t('business.yourEmail')}
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            required
            error={firstValidationError(errors, 'email')}
          />
        </div>
        <div className="col-12">
          <FormField
            label={t('business.subject')}
            name="subject"
            value={form.subject}
            onChange={onChange}
            error={firstValidationError(errors, 'subject')}
          />
        </div>
        <div className="col-12">
          <FormField
            label={t('business.message')}
            name="message"
            as="textarea"
            rows={5}
            value={form.message}
            onChange={onChange}
            required
            error={firstValidationError(errors, 'message')}
          />
        </div>
      </div>
      <button type="submit" className="btn btn-brand" disabled={submitting}>
        {submitting ? t('common.sending') : t('business.sendMessage')}
      </button>
    </form>
  )
}
