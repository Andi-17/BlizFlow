import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import FormField from '../../components/FormField'
import CountrySelect from '../../components/CountrySelect'
import IndustrySelect from '../../components/IndustrySelect'
import Alert from '../../components/Alert'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useAuth } from '../../hooks/useAuth'
import { useCompany } from '../../hooks/useCompany'
import { useAlert } from '../../hooks/useAlert'
import { useLocale } from '../../hooks/useLocale'
import { industryService } from '../../services/industryService'
import AuthGoogleDivider from '../../components/AuthGoogleDivider'
import { firstValidationError, getErrorMessage, getValidationErrors, unwrapList } from '../../utils/formatters'
import { regionForCountry } from '../../utils/regions'

export default function Register() {
  const { requestRegistrationCode, confirmRegistration } = useAuth()
  const { loadCompanies, selectCompany } = useCompany()
  const { success } = useAlert()
  const { t, setLocale } = useLocale()
  const navigate = useNavigate()
  const [industries, setIndustries] = useState([])
  const [loadingIndustries, setLoadingIndustries] = useState(true)
  const [phase, setPhase] = useState('account')
  const [step, setStep] = useState('details')
  const [devCode, setDevCode] = useState(null)
  const [mailHint, setMailHint] = useState(null)
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    password_confirmation: '',
    company_name: '',
    country: '',
    industry: '',
    verification_code: '',
  })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const selectedRegion = regionForCountry(form.country)
  const selectedIndustry = industries.find((industry) => industry.slug === form.industry)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const response = await industryService.list()
        const { items } = unwrapList(response.data)
        const list = items.length ? items : Array.isArray(response.data) ? response.data : []
        if (active) setIndustries(list)
      } catch {
        // keep empty — onboarding still works
      } finally {
        if (active) setLoadingIndustries(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    if (name === 'country') {
      const region = regionForCountry(value)
      if (region?.locale) setLocale(region.locale)
    }
  }

  const goToBusiness = (event) => {
    event.preventDefault()
    setErrors({})
    setError(null)
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = [t('common.required') || 'Required']
    if (!form.username.trim()) nextErrors.username = [t('common.required') || 'Required']
    if (!form.email.trim()) nextErrors.email = [t('common.required') || 'Required']
    if (!form.password) nextErrors.password = [t('common.required') || 'Required']
    if (form.password !== form.password_confirmation) {
      nextErrors.password_confirmation = [t('auth.passwordMismatch') || 'Passwords do not match']
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }
    setPhase('business')
  }

  const onRequestCode = async (event) => {
    event.preventDefault()
    if (!form.country || !form.industry) {
      setErrors({
        ...(form.country ? {} : { country: [t('common.required') || 'Required'] }),
        ...(form.industry ? {} : { industry: [t('common.required') || 'Required'] }),
      })
      return
    }
    setSubmitting(true)
    setErrors({})
    setError(null)
    try {
      const payload = {
        name: form.name,
        username: form.username.trim().toLowerCase(),
        email: form.email,
        password: form.password,
        password_confirmation: form.password_confirmation,
        industry: form.industry,
        country: form.country,
      }
      if (form.company_name.trim()) payload.company_name = form.company_name.trim()

      const response = await requestRegistrationCode(payload)
      success(response.message || t('auth.codeSent'))
      setDevCode(response.data?.dev_code || null)
      setMailHint(response.data?.mail_hint || null)
      if (response.data?.dev_code) {
        setForm((current) => ({ ...current, verification_code: response.data.dev_code }))
      }
      setStep('verify')
    } catch (err) {
      setErrors(getValidationErrors(err))
      setError(getErrorMessage(err, t('auth.verifyFail')))
    } finally {
      setSubmitting(false)
    }
  }

  const onConfirm = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    setError(null)
    try {
      const response = await confirmRegistration({
        email: form.email,
        verification_code: form.verification_code.trim(),
      })
      if (response.data?.locale) {
        setLocale(response.data.locale)
      }
      success(response.message || t('auth.welcomeBack'))
      const company = response.data?.company
      if (company?.id) {
        selectCompany(company.id)
        navigate('/app')
      } else {
        const companies = await loadCompanies()
        if (companies?.length) {
          navigate('/app')
        } else {
          navigate('/onboarding/company', { state: { industry: form.industry, country: form.country } })
        }
      }
    } catch (err) {
      setErrors(getValidationErrors(err))
      setError(getErrorMessage(err, t('auth.verifyFail')))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="signup">
      <div className="signup__intro">
        {step === 'details' && phase === 'account' ? (
          <p className="signup__badge">
            <i className="bi bi-gift" aria-hidden="true" />
            {t('auth.signupTrialBadge')}
          </p>
        ) : null}
        <h1 className="mb-1">
          {step === 'verify'
            ? t('auth.verifyEmail')
            : phase === 'business'
              ? t('auth.signupBusinessTitle')
              : t('auth.registerTitle')}
        </h1>
        <p className="text-secondary mb-0">
          {step === 'verify'
            ? t('auth.registerCodeLede', { email: form.email })
            : phase === 'business'
              ? t('auth.signupBusinessLede')
              : t('auth.registerLede')}
        </p>
      </div>

      {step === 'details' ? (
        <div className="signup__steps" aria-hidden="true">
          <span className={`signup__step ${phase === 'account' ? 'is-active' : 'is-done'}`}>
            <em>{phase === 'account' ? '1' : <i className="bi bi-check2" aria-hidden="true" />}</em>
            {t('auth.signupStepAccount')}
          </span>
          <span className={`signup__step-line ${phase === 'business' ? 'is-filled' : ''}`} />
          <span className={`signup__step ${phase === 'business' ? 'is-active' : ''}`}>
            <em>2</em> {t('auth.signupStepBusiness')}
          </span>
        </div>
      ) : null}

      {error ? <Alert type="danger" message={error} /> : null}
      {step === 'verify' && devCode ? (
        <Alert
          type="warning"
          message={`${mailHint || 'Local mail mode.'} Your code: ${devCode}`}
        />
      ) : null}

      {step === 'details' && phase === 'account' ? (
        <form className="signup__form" onSubmit={goToBusiness}>
          <AuthGoogleDivider googleLabel={t('auth.googleContinue')} orLabel={t('auth.orEmail')} />
          <div className="signup__grid">
            <FormField
              label={t('auth.fullName')}
              name="name"
              value={form.name}
              onChange={onChange}
              required
              error={firstValidationError(errors, 'name')}
            />
            <FormField
              label={t('auth.username')}
              name="username"
              value={form.username}
              onChange={onChange}
              required
              helpText={t('auth.usernameHelp')}
              error={firstValidationError(errors, 'username')}
            />
          </div>
          <FormField
            label={t('contact.email')}
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            required
            error={firstValidationError(errors, 'email')}
          />
          <div className="signup__grid">
            <FormField
              label={t('auth.password')}
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              required
              error={firstValidationError(errors, 'password')}
            />
            <FormField
              label={t('auth.confirmPassword')}
              name="password_confirmation"
              type="password"
              value={form.password_confirmation}
              onChange={onChange}
              required
              error={firstValidationError(errors, 'password_confirmation')}
            />
          </div>
          <button type="submit" className="btn btn-brand btn-lg w-100 signup__cta">
            {t('auth.signupContinue')}
          </button>
        </form>
      ) : null}

      {step === 'details' && phase === 'business' ? (
        <form className="signup__form" onSubmit={onRequestCode}>
          <FormField
            label={t('auth.companyName')}
            name="company_name"
            value={form.company_name}
            onChange={onChange}
            helpText={t('auth.companyHelp')}
            error={firstValidationError(errors, 'company_name')}
          />

          <label className="form-label" htmlFor="country">
            {t('auth.country')} <span className="text-danger">*</span>
          </label>
          <CountrySelect
            id="country"
            name="country"
            value={form.country}
            onChange={onChange}
            placeholder={t('auth.countrySearchPlaceholder')}
            required
            error={Boolean(firstValidationError(errors, 'country'))}
            className="mb-1"
          />
          {form.country ? (
            <p className="form-text mb-3">
              {t('auth.regionHint', {
                currency: selectedRegion?.currency || 'EUR',
                language: t(`auth.localeNames.${selectedRegion?.locale || 'en'}`),
              })}
            </p>
          ) : (
            <p className="form-text mb-3">{t('auth.countryHelp')}</p>
          )}
          {firstValidationError(errors, 'country') ? (
            <div className="text-danger small mb-2">{firstValidationError(errors, 'country')}</div>
          ) : null}

          <label className="form-label" htmlFor="industry">
            {t('auth.businessType')} <span className="text-danger">*</span>
          </label>
          {loadingIndustries ? <LoadingSpinner /> : null}
          <IndustrySelect
            id="industry"
            name="industry"
            value={form.industry}
            industries={industries}
            onChange={onChange}
            placeholder={t('auth.industrySearchPlaceholder')}
            required
            error={Boolean(firstValidationError(errors, 'industry'))}
            className="mb-1"
          />
          {selectedIndustry ? (
            <p className="form-text mb-3">{selectedIndustry.description}</p>
          ) : (
            <p className="form-text mb-3">{t('auth.industryHelp')}</p>
          )}
          {firstValidationError(errors, 'industry') ? (
            <div className="text-danger small mb-2">{firstValidationError(errors, 'industry')}</div>
          ) : null}

          <div className="signup__actions">
            <button
              type="button"
              className="btn btn-outline-brand"
              disabled={submitting}
              onClick={() => setPhase('account')}
            >
              {t('common.back') || 'Back'}
            </button>
            <button type="submit" className="btn btn-brand btn-lg flex-grow-1" disabled={submitting}>
              {submitting ? t('auth.sendCode') : t('auth.sendVerify')}
            </button>
          </div>
        </form>
      ) : null}

      {step === 'verify' ? (
        <form className="signup__form" onSubmit={onConfirm}>
          <FormField
            label={t('auth.verifyCode')}
            name="verification_code"
            value={form.verification_code}
            onChange={onChange}
            required
            helpText={t('auth.codeHelp')}
            error={firstValidationError(errors, 'verification_code')}
          />
          <button type="submit" className="btn btn-brand btn-lg w-100 signup__cta" disabled={submitting}>
            {submitting ? t('common.verifying') : t('auth.verifyCreate')}
          </button>
          <button
            type="button"
            className="btn btn-link w-100 mt-2"
            disabled={submitting}
            onClick={() => {
              setStep('details')
              setPhase('business')
            }}
          >
            {t('auth.editDetails')}
          </button>
        </form>
      ) : null}

      <p className="small mt-3 mb-0 signup__login">
        {t('auth.haveAccount')} <Link to="/login">{t('common.signIn')}</Link>
      </p>
    </div>
  )
}
