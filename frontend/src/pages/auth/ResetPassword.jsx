import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import FormField from '../../components/FormField'
import Alert from '../../components/Alert'
import { authService } from '../../services/authService'
import { firstValidationError, getErrorMessage, getValidationErrors } from '../../utils/formatters'
import { useLocale } from '../../hooks/useLocale'

export default function ResetPassword() {
  const { t } = useLocale()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    token: params.get('token') || '',
    email: params.get('email') || '',
    password: '',
    password_confirmation: '',
  })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

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
      await authService.resetPassword(form)
      navigate('/login', { replace: true })
    } catch (err) {
      setErrors(getValidationErrors(err))
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <h1 className="mb-1">{t('auth.newPasswordTitle')}</h1>
      <p className="text-secondary mb-4">{t('auth.newPasswordLede')}</p>
      {error ? <Alert type="danger" message={error} /> : null}
      <form onSubmit={onSubmit}>
        <FormField label={t('contact.email')} name="email" type="email" value={form.email} onChange={onChange} required error={firstValidationError(errors, 'email')} />
        <FormField label={t('auth.token')} name="token" value={form.token} onChange={onChange} required error={firstValidationError(errors, 'token')} />
        <FormField label={t('auth.newPassword')} name="password" type="password" value={form.password} onChange={onChange} required error={firstValidationError(errors, 'password')} />
        <FormField label={t('auth.confirmPassword')} name="password_confirmation" type="password" value={form.password_confirmation} onChange={onChange} required error={firstValidationError(errors, 'password_confirmation')} />
        <button type="submit" className="btn btn-brand w-100" disabled={submitting}>
          {submitting ? t('auth.saving') : t('auth.updatePassword')}
        </button>
      </form>
      <p className="small mt-3 mb-0">
        <Link to="/login">{t('auth.backSignIn')}</Link>
      </p>
    </>
  )
}
