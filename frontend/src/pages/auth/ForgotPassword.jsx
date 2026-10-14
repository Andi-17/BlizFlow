import { useState } from 'react'
import { Link } from 'react-router-dom'
import FormField from '../../components/FormField'
import Alert from '../../components/Alert'
import { authService } from '../../services/authService'
import { firstValidationError, getErrorMessage, getValidationErrors } from '../../utils/formatters'
import { useLocale } from '../../hooks/useLocale'

export default function ForgotPassword() {
  const { t } = useLocale()
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    setError(null)
    setSuccess(null)
    try {
      const response = await authService.forgotPassword({ email })
      setSuccess(response.message || 'Reset link sent if the account exists.')
    } catch (err) {
      setErrors(getValidationErrors(err))
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <h1 className="mb-1">{t('auth.resetTitle')}</h1>
      <p className="text-secondary mb-4">{t('auth.resetLede')}</p>
      {success ? <Alert type="success" message={success} /> : null}
      {error ? <Alert type="danger" message={error} /> : null}
      <form onSubmit={onSubmit}>
        <FormField
          label={t('contact.email')}
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          error={firstValidationError(errors, 'email')}
        />
        <button type="submit" className="btn btn-brand w-100" disabled={submitting}>
          {submitting ? t('common.sending') : t('auth.sendReset')}
        </button>
      </form>
      <p className="small mt-3 mb-0">
        <Link to="/login">{t('auth.backSignIn')}</Link>
      </p>
    </>
  )
}
