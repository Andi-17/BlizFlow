import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import FormField from '../../components/FormField'
import Alert from '../../components/Alert'
import LoadingSpinner from '../../components/LoadingSpinner'
import { companyService } from '../../services/companyService'
import { industryService } from '../../services/industryService'
import { useCompany } from '../../hooks/useCompany'
import { useAlert } from '../../hooks/useAlert'
import { useLocale } from '../../hooks/useLocale'
import { firstValidationError, getErrorMessage, getValidationErrors, unwrapList } from '../../utils/formatters'

const emptyForm = { name: '', industry: 'general', email: '', phone: '', verification_code: '' }

export default function Companies() {
  const navigate = useNavigate()
  const { companies, companyId, selectCompany, refreshCompany, leaveCompany, loading } = useCompany()
  const { success } = useAlert()
  const { t } = useLocale()
  const [industries, setIndustries] = useState([])
  const [limits, setLimits] = useState({ owned_companies: 0, max_companies: 2, can_create: true })
  const [showCreate, setShowCreate] = useState(false)
  const [step, setStep] = useState('details')
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [codeHint, setCodeHint] = useState(null)

  const loadLimits = async () => {
    try {
      const response = await companyService.limits()
      if (response.data) setLimits(response.data)
    } catch {
      // optional
    }
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const response = await industryService.list()
        const { items } = unwrapList(response.data)
        const list = items.length ? items : Array.isArray(response.data) ? response.data : []
        if (active) setIndustries(list)
      } catch {
        // optional
      }
      if (active) await loadLimits()
    })()
    return () => {
      active = false
    }
  }, [])

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const payloadFromForm = () => ({
    name: form.name,
    industry: form.industry,
    email: form.email || null,
    phone: form.phone || null,
    plan: 'free',
  })

  const onRequestCode = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    setError(null)
    try {
      const response = await companyService.requestCode(payloadFromForm())
      const hint = response.data?.dev_code
        ? `${response.data.mail_hint || 'Local mail mode.'} Code: ${response.data.dev_code}`
        : response.message || `Code sent to ${response.data?.email || 'your email'}`
      setCodeHint(hint)
      if (response.data?.dev_code) {
        setForm((current) => ({ ...current, verification_code: response.data.dev_code }))
      }
      success(response.data?.dev_code ? 'Use the local verification code shown below' : 'Check your email for the 6-digit code')
      setStep('code')
      await loadLimits()
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
        ...payloadFromForm(),
        verification_code: form.verification_code,
      })
      const created = response.data
      success(response.message || 'Company created')
      await refreshCompany()
      if (created?.id) {
        await selectCompany(created.id)
        navigate('/app')
      }
      setShowCreate(false)
      setStep('details')
      setForm(emptyForm)
      setCodeHint(null)
      await loadLimits()
    } catch (err) {
      setErrors(getValidationErrors(err))
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && !companies.length) return <LoadingSpinner />

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{t('app.companiesTitle')}</h1>
          <p className="text-secondary mb-0">
            Leave a company anytime without logging out. Pick another saved workspace, or create a new one (max {limits.max_companies} owned).
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {companyId ? (
            <button
              type="button"
              className="btn btn-outline-brand"
              onClick={() => {
                leaveCompany()
                success('Left workspace — pick a company when ready')
                navigate('/app/workspaces')
              }}
            >
              Leave company
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn-brand"
            disabled={!limits.can_create && !showCreate}
            onClick={() => {
              setShowCreate((value) => !value)
              setStep('details')
              setError(null)
              setCodeHint(null)
            }}
          >
            {showCreate ? 'Cancel' : 'Add company'}
          </button>
        </div>
      </div>

      {!limits.can_create ? (
        <Alert
          type="warning"
          message={
            <>
              {t('pricing.companiesFull', { max: String(limits.max_companies) })}{' '}
              <Link to="/app/billing">{t('pricing.upgradeCta')}</Link>
            </>
          }
        />
      ) : null}

      {showCreate ? (
        <form className="panel mb-4" onSubmit={step === 'details' ? onRequestCode : onConfirm} style={{ maxWidth: 640 }}>
          <h2 className="h5 mb-3">{step === 'details' ? 'Create another company' : 'Enter email verification code'}</h2>
          {error ? <Alert type="danger" message={error} /> : null}
          {codeHint ? <Alert type="info" message={codeHint} /> : null}

          {step === 'details' ? (
            <>
              <FormField label="Company name" name="name" value={form.name} onChange={onChange} required error={firstValidationError(errors, 'name')} />
              <FormField
                label="Industry"
                name="industry"
                as="select"
                value={form.industry}
                onChange={onChange}
                error={firstValidationError(errors, 'industry')}
                options={industries.map((item) => ({ value: item.slug, label: item.name }))}
              />
              <div className="row">
                <div className="col-md-6">
                  <FormField label="Email" name="email" type="email" value={form.email} onChange={onChange} error={firstValidationError(errors, 'email')} />
                </div>
                <div className="col-md-6">
                  <FormField label="Phone" name="phone" value={form.phone} onChange={onChange} error={firstValidationError(errors, 'phone')} />
                </div>
              </div>
              <p className="small text-secondary">We will email a 6-digit code to your account email before the company is created.</p>
              <button type="submit" className="btn btn-brand" disabled={submitting || !limits.can_create}>
                {submitting ? 'Sending code…' : 'Send verification code'}
              </button>
            </>
          ) : (
            <>
              <FormField
                label="Verification code"
                name="verification_code"
                value={form.verification_code}
                onChange={onChange}
                required
                error={firstValidationError(errors, 'verification_code')}
                helpText="Check your inbox for the BizFlow code."
              />
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-brand" disabled={submitting}>
                  {submitting ? 'Verifying…' : 'Verify & create'}
                </button>
                <button type="button" className="btn btn-outline-brand" disabled={submitting} onClick={onRequestCode}>
                  Resend code
                </button>
                <button type="button" className="btn btn-outline-brand" onClick={() => setStep('details')}>
                  Back
                </button>
              </div>
            </>
          )}
        </form>
      ) : null}

      <div className="row g-3">
        {companies.map((item) => {
          const active = String(item.id) === String(companyId)
          return (
            <div className="col-md-6 col-xl-4" key={item.id}>
              <div className={`panel h-100 company-card ${active ? 'is-active' : ''}`}>
                <div className="d-flex justify-content-between gap-2 mb-2">
                  <h2 className="h5 mb-0">{item.name}</h2>
                  {active ? <span className="badge badge-soft">Active</span> : null}
                </div>
                <p className="small text-secondary mb-3">
                  {item.industry_meta?.name || item.industry || 'General'}
                  {item.city ? ` · ${item.city}` : ''}
                </p>
                <div className="d-flex gap-2">
                  {active ? (
                    <Link to="/app" className="btn btn-sm btn-brand">
                      Open dashboard
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-brand"
                      onClick={async () => {
                        await selectCompany(item.id)
                        success(`Opened ${item.name}`)
                        navigate('/app')
                      }}
                    >
                      Open this company
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {!companies.length ? (
          <div className="col-12">
            <div className="panel text-center py-5">
              <p className="text-secondary mb-3">You don’t have a company yet.</p>
              <button type="button" className="btn btn-brand" onClick={() => setShowCreate(true)} disabled={!limits.can_create}>
                Create your first company
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}
