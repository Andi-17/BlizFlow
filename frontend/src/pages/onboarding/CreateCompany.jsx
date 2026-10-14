import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import FormField from '../../components/FormField'
import CountrySelect from '../../components/CountrySelect'
import IndustrySelect from '../../components/IndustrySelect'
import Alert from '../../components/Alert'
import LoadingSpinner from '../../components/LoadingSpinner'
import { companyService } from '../../services/companyService'
import { industryService } from '../../services/industryService'
import { useCompany } from '../../hooks/useCompany'
import { useAlert } from '../../hooks/useAlert'
import { useAuth } from '../../hooks/useAuth'
import { useLocale } from '../../hooks/useLocale'
import { firstValidationError, getErrorMessage, getValidationErrors, unwrapList } from '../../utils/formatters'
import { regionForCountry } from '../../utils/regions'

const initial = {
  name: '',
  industry: 'general',
  tagline: '',
  email: '',
  phone: '',
  address_line1: '',
  city: '',
  country: '',
  verification_code: '',
}

export default function CreateCompany() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { selectCompany, refreshCompany, hasMembership, ready, companies } = useCompany()
  const { success } = useAlert()
  const { t, setLocale } = useLocale()
  const [form, setForm] = useState({
    ...initial,
    industry: location.state?.industry || 'general',
    country: location.state?.country || '',
  })
  const [industries, setIndustries] = useState([])
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [loadingIndustries, setLoadingIndustries] = useState(true)
  const [step, setStep] = useState('details')
  const [codeHint, setCodeHint] = useState(null)
  const [limits, setLimits] = useState({ can_create: true, max_companies: 2, owned_companies: 0 })

  useEffect(() => {
    if (user?.email) {
      setForm((current) => ({
        ...current,
        email: current.email || user.email,
      }))
    }
  }, [user?.email])

  useEffect(() => {
    if (ready && (hasMembership || companies.length)) {
      navigate('/app/workspaces', { replace: true })
    }
  }, [ready, hasMembership, companies.length, navigate])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const [industryRes, limitsRes] = await Promise.all([
          industryService.list(),
          companyService.limits().catch(() => null),
        ])
        const { items } = unwrapList(industryRes.data)
        const list = items.length ? items : Array.isArray(industryRes.data) ? industryRes.data : []
        if (active) setIndustries(list)
        if (active && limitsRes?.data) setLimits(limitsRes.data)
      } catch (err) {
        if (active) setError(getErrorMessage(err, 'Unable to load industries'))
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

  const selectIndustry = (slug) => {
    const selected = industries.find((item) => item.slug === slug)
    setForm((current) => ({
      ...current,
      industry: slug,
      tagline: current.tagline || selected?.description || '',
    }))
  }

  const companyPayload = () => ({
    name: form.name,
    industry: form.industry,
    tagline: form.tagline || null,
    email: form.email || user?.email || null,
    phone: form.phone || null,
    address_line1: form.address_line1 || null,
    city: form.city || null,
    country: form.country || null,
    plan: 'free',
  })

  const onRequestCode = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    setError(null)
    try {
      const response = await companyService.requestCode(companyPayload())
      const hint = response.data?.dev_code
        ? `${response.data.mail_hint || 'Local mail mode.'} Code: ${response.data.dev_code}`
        : response.message || `Code sent to ${response.data?.email || 'your email'}`
      setCodeHint(hint)
      if (response.data?.dev_code) {
        setForm((current) => ({ ...current, verification_code: response.data.dev_code }))
      }
      success(response.data?.dev_code ? 'Use the local verification code shown below' : 'Verification code sent to your email')
      setStep('code')
    } catch (err) {
      setErrors(getValidationErrors(err))
      setError(getErrorMessage(err))
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
      const response = await companyService.confirm({
        ...companyPayload(),
        verification_code: form.verification_code,
      })
      const company = response.data
      if (company?.id) await selectCompany(company.id)
      await refreshCompany()
      success(response.message || 'Workspace created')
      navigate('/app')
    } catch (err) {
      setErrors(getValidationErrors(err))
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const selectedIndustry = industries.find((industry) => industry.slug === form.industry)

  return (
    <div className="container py-5" style={{ maxWidth: 640 }}>
      <div className="panel page-enter onboarding-panel">
        <p className="eyebrow">Step 1 · Workspace</p>
        <h1 className="h2 mb-1">
          {step === 'details' ? 'Create your workspace' : 'Verify your email'}
        </h1>
        <p className="text-secondary mb-4">
          {step === 'details'
            ? `BizFlow adapts to your trade. You can own up to ${limits.max_companies} companies with one email.`
            : 'Enter the 6-digit code we sent to your account email to create this company.'}
        </p>
        {error ? <Alert type="danger" message={error} /> : null}
        {codeHint ? <Alert type="info" message={codeHint} /> : null}
        {!limits.can_create ? (
          <Alert type="warning" message={`You already own ${limits.owned_companies}/${limits.max_companies} companies.`} />
        ) : null}
        {loadingIndustries ? <LoadingSpinner /> : null}

        {step === 'details' && !loadingIndustries ? (
          <form onSubmit={onRequestCode}>
            <div className="mb-3">
              <label className="form-label" htmlFor="industry">
                {t('auth.businessType')} <span className="text-danger">*</span>
              </label>
              <IndustrySelect
                id="industry"
                name="industry"
                value={form.industry}
                industries={industries}
                onChange={(event) => selectIndustry(event.target.value)}
                placeholder={t('auth.industrySearchPlaceholder')}
                required
                error={Boolean(firstValidationError(errors, 'industry'))}
              />
              {selectedIndustry ? (
                <p className="form-text mb-0">{selectedIndustry.description}</p>
              ) : null}
              {firstValidationError(errors, 'industry') ? (
                <p className="text-danger small mb-0 mt-1">{firstValidationError(errors, 'industry')}</p>
              ) : null}
            </div>

            <div className="row g-3">
              <div className="col-md-8">
                <FormField label="Company name" name="name" value={form.name} onChange={onChange} required error={firstValidationError(errors, 'name')} />
              </div>
              <div className="col-md-4">
                <FormField label="Phone" name="phone" value={form.phone} onChange={onChange} error={firstValidationError(errors, 'phone')} />
              </div>
              <div className="col-12">
                <FormField label="Tagline" name="tagline" value={form.tagline} onChange={onChange} error={firstValidationError(errors, 'tagline')} />
              </div>
              <div className="col-md-6">
                <FormField
                  label="Business contact email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  helpText="Used on your public landing page. Defaults to your account email."
                  error={firstValidationError(errors, 'email')}
                />
              </div>
              <div className="col-md-6">
                <FormField label="Address" name="address_line1" value={form.address_line1} onChange={onChange} error={firstValidationError(errors, 'address_line1')} />
              </div>
              <div className="col-md-6">
                <FormField label="City" name="city" value={form.city} onChange={onChange} error={firstValidationError(errors, 'city')} />
              </div>
              <div className="col-md-6">
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
                />
                {form.country ? (
                  <p className="form-text">
                    {t('auth.regionHint', {
                      currency: regionForCountry(form.country)?.currency || 'EUR',
                      language: t(`auth.localeNames.${regionForCountry(form.country)?.locale || 'en'}`),
                    })}
                  </p>
                ) : null}
                {firstValidationError(errors, 'country') ? (
                  <div className="invalid-feedback d-block">{firstValidationError(errors, 'country')}</div>
                ) : null}
              </div>
            </div>
            <button type="submit" className="btn btn-brand btn-lg mt-3" disabled={submitting || !form.industry || !form.country || !limits.can_create}>
              {submitting ? 'Sending code…' : 'Send verification code'}
            </button>
          </form>
        ) : null}

        {step === 'code' ? (
          <form onSubmit={onConfirm}>
            <FormField
              label="Verification code"
              name="verification_code"
              value={form.verification_code}
              onChange={onChange}
              required
              error={firstValidationError(errors, 'verification_code')}
            />
            <div className="d-flex flex-wrap gap-2 mt-3">
              <button type="submit" className="btn btn-brand btn-lg" disabled={submitting}>
                {submitting ? 'Creating workspace…' : 'Verify & continue'}
              </button>
              <button type="button" className="btn btn-outline-brand btn-lg" disabled={submitting} onClick={onRequestCode}>
                Resend code
              </button>
              <button type="button" className="btn btn-outline-brand btn-lg" onClick={() => setStep('details')}>
                Back
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  )
}
