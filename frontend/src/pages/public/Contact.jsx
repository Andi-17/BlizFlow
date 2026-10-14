import { useState } from 'react'
import FormField from '../../components/FormField'
import Alert from '../../components/Alert'
import { planService } from '../../services/planService'
import { firstValidationError, getErrorMessage, getValidationErrors } from '../../utils/formatters'
import { useLocale } from '../../hooks/useLocale'

const initial = { name: '', email: '', subject: '', message: '' }

export default function Contact() {
  const { t } = useLocale()
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    setError(null)
    setSuccess(null)
    try {
      const response = await planService.contact(form)
      setSuccess(response.message || t('contact.success'))
      setForm(initial)
    } catch (err) {
      setErrors(getValidationErrors(err))
      setError(getErrorMessage(err, t('contact.fail')))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <section className="page-hero page-hero--luxe">
        <div className="container page-hero__inner">
          <p className="eyebrow">{t('contact.kicker')}</p>
          <h1>{t('contact.title')}</h1>
          <p className="page-hero__lede">{t('contact.lede')}</p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <div className="row g-4 justify-content-center">
            <div className="col-lg-7">
              {success ? <Alert type="success" message={success} /> : null}
              {error ? <Alert type="danger" message={error} /> : null}
              <form className="panel contact-panel" onSubmit={onSubmit}>
                <FormField label={t('contact.name')} name="name" value={form.name} onChange={onChange} required error={firstValidationError(errors, 'name')} />
                <FormField label={t('contact.email')} name="email" type="email" value={form.email} onChange={onChange} required error={firstValidationError(errors, 'email')} />
                <FormField label={t('contact.subject')} name="subject" value={form.subject} onChange={onChange} error={firstValidationError(errors, 'subject')} />
                <FormField
                  label={t('contact.message')}
                  name="message"
                  as="textarea"
                  rows={5}
                  value={form.message}
                  onChange={onChange}
                  required
                  error={firstValidationError(errors, 'message')}
                />
                <button type="submit" className="btn btn-brand btn-lg" disabled={submitting}>
                  {submitting ? t('contact.sending') : t('contact.send')}
                </button>
              </form>
            </div>
            <div className="col-lg-4">
              <aside className="contact-aside">
                <h2>{t('contact.asideTitle')}</h2>
                <p>{t('contact.asideText')}</p>
                <p className="mb-0 text-secondary">{t('contact.asideReply')}</p>
              </aside>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
