import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import FormField from '../../components/FormField'
import Alert from '../../components/Alert'
import AuthGoogleDivider from '../../components/AuthGoogleDivider'
import { useAuth } from '../../hooks/useAuth'
import { useCompany } from '../../hooks/useCompany'
import { useAlert } from '../../hooks/useAlert'
import { useLocale } from '../../hooks/useLocale'
import { firstValidationError, getErrorMessage, getValidationErrors } from '../../utils/formatters'

const GOOGLE_ERRORS = {
  google_not_configured: 'auth.googleNotConfigured',
  google_denied: 'auth.googleDenied',
  google_failed: 'auth.googleFail',
  google_inactive: 'auth.googleInactive',
}

export default function Login() {
  const { requestLoginCode, confirmLogin } = useAuth()
  const { loadCompanies } = useCompany()
  const { success } = useAlert()
  const { t } = useLocale()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState('credentials')
  const [form, setForm] = useState({
    login: '',
    password: '',
    remember: true,
    verification_code: '',
    user_id: null,
  })
  const [emailHint, setEmailHint] = useState('')
  const [devCode, setDevCode] = useState(null)
  const [mailHint, setMailHint] = useState(null)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const code = searchParams.get('error')
    if (code && GOOGLE_ERRORS[code]) {
      setError(t(GOOGLE_ERRORS[code]))
    }
  }, [searchParams, t])

  const onChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  const finishLogin = async (response) => {
    success(response.message || t('auth.welcomeBack'))
    const session = response.session || {}
    const companies = await loadCompanies()
    const companyCount =
      companies?.length
      || session.companies?.length
      || session.memberships?.length
      || 0
    const user = session.user || response.data?.user

    if (user?.is_platform_admin && companyCount === 0) {
      navigate('/admin', { replace: true })
    } else if (companyCount === 0) {
      navigate('/onboarding/company', { replace: true })
    } else {
      navigate('/app', { replace: true })
    }
  }

  const onRequestCode = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setErrors({})
    try {
      const response = await requestLoginCode({
        login: form.login,
        password: form.password,
        remember: form.remember,
      })
      setEmailHint(response.data?.email_hint || response.data?.email || '')
      setDevCode(response.data?.dev_code || null)
      setMailHint(response.data?.mail_hint || null)
      setForm((current) => ({
        ...current,
        user_id: response.data?.user_id || null,
        verification_code: response.data?.dev_code || '',
      }))
      success(response.message || t('auth.codeSent'))
      setStep('verify')
    } catch (err) {
      setErrors(getValidationErrors(err))
      setError(getErrorMessage(err, t('auth.loginFail')))
    } finally {
      setSubmitting(false)
    }
  }

  const onConfirm = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setErrors({})
    try {
      const response = await confirmLogin({
        user_id: Number(form.user_id),
        verification_code: form.verification_code.trim(),
        remember: form.remember,
      })
      await finishLogin(response)
    } catch (err) {
      setErrors(getValidationErrors(err))
      setError(getErrorMessage(err, t('auth.verifyFail')))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <h1 className="mb-1">{step === 'credentials' ? t('auth.welcome') : t('auth.verifyLogin')}</h1>
      <p className="text-secondary mb-4">
        {step === 'credentials'
          ? t('auth.loginLede')
          : t('auth.codeSentTo', { email: emailHint || t('auth.yourEmail') })}
      </p>
      {error ? <Alert type="danger" message={error} /> : null}
      {step === 'verify' && devCode ? (
        <Alert type="warning" message={`${mailHint || 'Local mail mode.'} Your code: ${devCode}`} />
      ) : null}

      {step === 'credentials' ? (
        <form onSubmit={onRequestCode}>
          <AuthGoogleDivider googleLabel={t('auth.googleContinue')} orLabel={t('auth.orEmail')} />
          <FormField
            label={t('auth.loginOrUser')}
            name="login"
            value={form.login}
            onChange={onChange}
            required
            error={firstValidationError(errors, 'login') || firstValidationError(errors, 'email')}
          />
          <FormField
            label={t('auth.password')}
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            required
            error={firstValidationError(errors, 'password')}
          />
          <div className="form-check mb-3">
            <input className="form-check-input" type="checkbox" id="remember" name="remember" checked={form.remember} onChange={onChange} />
            <label className="form-check-label" htmlFor="remember">
              {t('auth.remember')}
            </label>
          </div>
          <button type="submit" className="btn btn-brand w-100" disabled={submitting}>
            {submitting ? t('auth.sendCode') : t('common.continue')}
          </button>
        </form>
      ) : (
        <form onSubmit={onConfirm}>
          <FormField
            label={t('auth.verifyCode')}
            name="verification_code"
            value={form.verification_code}
            onChange={onChange}
            required
            error={firstValidationError(errors, 'verification_code')}
          />
          <button type="submit" className="btn btn-brand w-100" disabled={submitting}>
            {submitting ? t('common.verifying') : t('auth.verifySignIn')}
          </button>
          <button
            type="button"
            className="btn btn-link w-100 mt-2"
            disabled={submitting}
            onClick={() => setStep('credentials')}
          >
            ← {t('common.back')}
          </button>
        </form>
      )}

      <div className="d-flex justify-content-between mt-3 small">
        <Link to="/forgot-password">{t('auth.forgot')}</Link>
        <Link to="/register">{t('common.createAccount')}</Link>
      </div>
    </>
  )
}
