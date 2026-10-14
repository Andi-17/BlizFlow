import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FormField from '../../components/FormField'
import Alert from '../../components/Alert'
import LoadingSpinner from '../../components/LoadingSpinner'
import Modal from '../../components/Modal'
import { companyService } from '../../services/companyService'
import { industryService } from '../../services/industryService'
import { useAuth } from '../../hooks/useAuth'
import { useCompany } from '../../hooks/useCompany'
import { usePermissions } from '../../hooks/usePermissions'
import { useAlert } from '../../hooks/useAlert'
import { useLocale } from '../../hooks/useLocale'
import { firstValidationError, getErrorMessage, getValidationErrors, unwrapList } from '../../utils/formatters'
import { buildBusinessPublicUrl } from '../../utils/tenantHost'
import { DEFAULT_INVOICE_SETTINGS, landingHighlightMeta, normalizeInvoiceSettings, normalizeLandingPage } from '../../utils/businessExtras'

const empty = {
  name: '',
  industry: 'general',
  tagline: '',
  email: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
  is_public: true,
  opening_hours: '',
}

export default function Settings() {
  const navigate = useNavigate()
  const { deleteAccount, user } = useAuth()
  const { company, companyId, refreshCompany, leaveCompany, loadCompanies } = useCompany()
  const { membership, isAdmin } = usePermissions()
  const { success } = useAlert()
  const { t } = useLocale()
  const [form, setForm] = useState(empty)
  const [industries, setIndustries] = useState([])
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState(null)
  const [dangerMode, setDangerMode] = useState(null)
  const [dangerForm, setDangerForm] = useState({ password: '', confirmation: '' })
  const [dangerErrors, setDangerErrors] = useState({})
  const [dangerBusy, setDangerBusy] = useState(false)
  const [invoiceSettings, setInvoiceSettings] = useState(DEFAULT_INVOICE_SETTINGS)
  const [landingPage, setLandingPage] = useState(() => normalizeLandingPage({}, 'general'))

  const isOwner = Boolean(membership?.is_owner)
  const highlightMeta = landingHighlightMeta(form.industry || 'general')

  useEffect(() => {
    let active = true
    ;(async () => {
      if (!companyId) {
        setLoading(false)
        return
      }
      try {
        const [companyRes, industryRes] = await Promise.all([companyService.current(), industryService.list()])
        const { items } = unwrapList(industryRes.data)
        const list = items.length ? items : Array.isArray(industryRes.data) ? industryRes.data : []
        if (active) {
          setIndustries(list)
          setForm({
            ...empty,
            ...companyRes.data,
            is_public: companyRes.data?.is_public !== false,
            opening_hours: companyRes.data?.opening_hours || '',
          })
          setInvoiceSettings(
            normalizeInvoiceSettings(
              companyRes.data?.invoice_settings,
              companyRes.data?.industry || 'general',
            ),
          )
          setLandingPage(
            normalizeLandingPage(
              companyRes.data?.landing_page,
              companyRes.data?.industry || 'general',
            ),
          )
          setLogoPreview(companyRes.data?.logo_url || null)
        }
      } catch (err) {
        if (active) {
          if (company) {
            setForm({ ...empty, ...company })
            setLogoPreview(company.logo_url || null)
          }
          setError(getErrorMessage(err))
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [companyId])

  const onChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    if (name === 'industry') {
      setInvoiceSettings(normalizeInvoiceSettings({}, value))
      setLandingPage((current) => normalizeLandingPage({
        ...current,
        highlights_title: landingHighlightMeta(value).title,
      }, value))
    }
  }

  const onLandingFieldChange = (event) => {
    const { name, value } = event.target
    setLandingPage((current) => ({ ...current, [name]: value }))
  }

  const onHighlightChange = (index, field, value) => {
    setLandingPage((current) => ({
      ...current,
      highlights: current.highlights.map((row, rowIndex) => (
        rowIndex === index ? { ...row, [field]: value } : row
      )),
    }))
  }

  const addHighlight = () => {
    setLandingPage((current) => ({
      ...current,
      highlights: [...current.highlights, { name: '', price: '', description: '' }],
    }))
  }

  const removeHighlight = (index) => {
    setLandingPage((current) => ({
      ...current,
      highlights: current.highlights.filter((_, rowIndex) => rowIndex !== index),
    }))
  }

  const businessSlug = form.slug || company?.slug || null
  const publicUrl = businessSlug
    ? (company?.public_url || form.public_url || buildBusinessPublicUrl(businessSlug))
    : null

  const copyPublicLink = async () => {
    if (!publicUrl) return
    try {
      await navigator.clipboard.writeText(publicUrl)
      success(t('business.linkCopied'))
    } catch {
      setError(publicUrl)
    }
  }

  const onLogoChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !companyId) return
    setLogoUploading(true)
    setError(null)
    try {
      const response = await companyService.uploadLogo(companyId, file)
      setLogoPreview(response.data?.logo_url || null)
      success(response.message || 'Logo uploaded')
      await refreshCompany()
    } catch (err) {
      setErrors(getValidationErrors(err))
      setError(getErrorMessage(err, 'Logo upload failed'))
    } finally {
      setLogoUploading(false)
    }
  }

  const onRemoveLogo = async () => {
    if (!companyId || !logoPreview) return
    setLogoUploading(true)
    try {
      const response = await companyService.removeLogo(companyId)
      setLogoPreview(null)
      success(response.message || 'Logo removed')
      await refreshCompany()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLogoUploading(false)
    }
  }

  const onInvoiceSettingChange = (event) => {
    const { name, type, checked, value } = event.target
    setInvoiceSettings((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    if (!companyId) return
    setSubmitting(true)
    setErrors({})
    setError(null)
    try {
      const payload = {
        name: form.name,
        industry: form.industry,
        tagline: form.tagline || null,
        email: form.email || null,
        phone: form.phone || null,
        address_line1: form.address_line1 || null,
        address_line2: form.address_line2 || null,
        city: form.city || null,
        state: form.state || null,
        postal_code: form.postal_code || null,
        country: form.country || null,
        opening_hours: form.opening_hours || null,
        is_public: Boolean(form.is_public),
        settings: {
          invoice_settings: {
            ...invoiceSettings,
            custom_title: invoiceSettings.custom_title || null,
            custom_footer: invoiceSettings.custom_footer || null,
          },
          landing_page: {
            google_maps_url: landingPage.google_maps_url || null,
            google_maps_embed: landingPage.google_maps_embed || null,
            highlights_title: landingPage.highlights_title || null,
            highlights: (landingPage.highlights || [])
              .filter((row) => String(row.name || '').trim())
              .map((row) => ({
                name: String(row.name).trim(),
                price: String(row.price || '').trim() || null,
                description: String(row.description || '').trim() || null,
              })),
          },
        },
      }
      const response = await companyService.update(companyId, payload)
      success(response.message || 'Settings saved')
      await refreshCompany()
    } catch (err) {
      setErrors(getValidationErrors(err))
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const openDanger = (mode) => {
    setDangerMode(mode)
    setDangerForm({ password: '', confirmation: '' })
    setDangerErrors({})
  }

  const onDangerChange = (event) => {
    const { name, value } = event.target
    setDangerForm((current) => ({ ...current, [name]: value }))
  }

  const onDangerSubmit = async (event) => {
    event.preventDefault()
    setDangerBusy(true)
    setDangerErrors({})
    setError(null)
    try {
      const payload = {
        password: dangerForm.password,
        confirmation: dangerForm.confirmation.trim().toUpperCase(),
      }

      if (dangerMode === 'company') {
        await companyService.destroy(companyId, payload)
        success('Company and all its data deleted')
        setDangerMode(null)
        leaveCompany()
        await loadCompanies({ autoSelect: false })
        navigate('/app/workspaces')
        return
      }

      await deleteAccount(payload)
      success('Account deleted — you can register again from scratch')
      setDangerMode(null)
      navigate('/register')
    } catch (err) {
      setDangerErrors(getValidationErrors(err))
      setError(getErrorMessage(err))
    } finally {
      setDangerBusy(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{t('app.settingsTitle')}</h1>
          <p className="text-secondary mb-0">{t('app.settingsLede')}</p>
        </div>
      </div>
      {error ? <Alert type="danger" message={error} /> : null}

      <form className="panel" onSubmit={onSubmit} style={{ maxWidth: 760 }}>
        {publicUrl ? (
          <div className="mb-4 pb-3 border-bottom">
            <p className="eyebrow mb-1">{t('business.publicPage')}</p>
            <p className="text-secondary mb-3">{t('business.publicPageLede')}</p>
            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="is_public"
                name="is_public"
                checked={Boolean(form.is_public)}
                onChange={onChange}
              />
              <label className="form-check-label" htmlFor="is_public">
                {form.is_public ? t('business.publicVisible') : t('business.publicHidden')}
              </label>
            </div>
            <p className="small text-secondary mb-2">{publicUrl}</p>
            <div className="d-flex flex-wrap gap-2">
              <a href={publicUrl} className="btn btn-brand btn-sm">
                {t('business.openPublic')}
              </a>
              <button type="button" className="btn btn-outline-brand btn-sm" onClick={copyPublicLink}>
                {t('business.copyLink')}
              </button>
            </div>
          </div>
        ) : null}
        <div className="mb-4">
          <label className="form-label">Company logo (optional)</label>
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <div
              className="brand-mark__glyph"
              style={{ width: 56, height: 56, overflow: 'hidden', borderRadius: 12, background: 'var(--bf-surface-2)' }}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Company logo" className="brand-mark__logo" />
              ) : (
                <span className="small text-secondary d-grid place-items-center h-100" style={{ placeItems: 'center', display: 'grid', height: '100%' }}>
                  No logo
                </span>
              )}
            </div>
            <div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="form-control"
                onChange={onLogoChange}
                disabled={logoUploading}
              />
              <div className="form-text">PNG/JPG up to 2MB. Shown in the sidebar when set.</div>
              {logoPreview ? (
                <button type="button" className="btn btn-sm btn-outline-danger mt-2" disabled={logoUploading} onClick={onRemoveLogo}>
                  Remove logo
                </button>
              ) : null}
            </div>
          </div>
          {firstValidationError(errors, 'logo') ? (
            <div className="invalid-feedback d-block">{firstValidationError(errors, 'logo')}</div>
          ) : null}
        </div>
        <div className="row">
          <div className="col-md-6">
            <FormField label="Company name" name="name" value={form.name || ''} onChange={onChange} required error={firstValidationError(errors, 'name')} />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="industry">
              Industry
            </label>
            <select
              id="industry"
              name="industry"
              className="form-select mb-3"
              value={form.industry || 'general'}
              onChange={onChange}
            >
              {industries.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
            {firstValidationError(errors, 'industry') ? (
              <div className="invalid-feedback d-block">{firstValidationError(errors, 'industry')}</div>
            ) : null}
          </div>
          <div className="col-12">
            <FormField label="Tagline" name="tagline" value={form.tagline || ''} onChange={onChange} error={firstValidationError(errors, 'tagline')} />
          </div>
          <div className="col-md-6">
            <FormField label="Email" name="email" type="email" value={form.email || ''} onChange={onChange} error={firstValidationError(errors, 'email')} />
          </div>
          <div className="col-md-6">
            <FormField label="Phone" name="phone" value={form.phone || ''} onChange={onChange} error={firstValidationError(errors, 'phone')} />
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
            <FormField
              label={t('app.openingHours')}
              name="opening_hours"
              as="textarea"
              rows={3}
              value={form.opening_hours || ''}
              onChange={onChange}
              error={firstValidationError(errors, 'opening_hours')}
            />
            <div className="form-text">{t('app.openingHoursHelp')}</div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-top">
          <p className="eyebrow mb-1">{t('app.landingKicker')}</p>
          <h2 className="h5 mb-1">{t('app.landingTitle')}</h2>
          <p className="text-secondary mb-3">{t('app.landingLede')}</p>

          <FormField
            label={t('app.mapsUrl')}
            name="google_maps_url"
            value={landingPage.google_maps_url || ''}
            onChange={onLandingFieldChange}
            helpText={t('app.mapsUrlHelp')}
          />
          <FormField
            label={t('app.mapsEmbed')}
            name="google_maps_embed"
            as="textarea"
            rows={2}
            value={landingPage.google_maps_embed || ''}
            onChange={onLandingFieldChange}
            helpText={t('app.mapsEmbedHelp')}
          />

          <div className="mt-4">
            <h3 className="h6 mb-1">{highlightMeta.title}</h3>
            <p className="text-secondary small mb-3">{highlightMeta.lede}</p>
            <FormField
              label={t('app.highlightsTitle')}
              name="highlights_title"
              value={landingPage.highlights_title || ''}
              onChange={onLandingFieldChange}
            />
            {(landingPage.highlights || []).map((row, index) => (
              <div key={`highlight-${index}`} className="border rounded-3 p-3 mb-3" style={{ borderColor: 'var(--bf-border)' }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong className="small">#{index + 1}</strong>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeHighlight(index)}>
                    {t('app.removeItem')}
                  </button>
                </div>
                <div className="row g-2">
                  <div className="col-md-6">
                    <label className="form-label">{highlightMeta.nameLabel}</label>
                    <input
                      className="form-control"
                      value={row.name}
                      onChange={(event) => onHighlightChange(index, 'name', event.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">{highlightMeta.priceLabel}</label>
                    <input
                      className="form-control"
                      value={row.price}
                      placeholder="e.g. 10€ / 15 CHF"
                      onChange={(event) => onHighlightChange(index, 'price', event.target.value)}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">{highlightMeta.descriptionLabel}</label>
                    <input
                      className="form-control"
                      value={row.description}
                      onChange={(event) => onHighlightChange(index, 'description', event.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" className="btn btn-outline-brand btn-sm" onClick={addHighlight}>
              {highlightMeta.addLabel}
            </button>
          </div>
        </div>

        <div className="mt-4 pt-3 border-top">
          <p className="eyebrow mb-1">{t('app.invoiceSettingsKicker')}</p>
          <h2 className="h5 mb-1">{t('app.invoiceSettingsTitle')}</h2>
          <p className="text-secondary mb-3">{t('app.invoiceSettingsLede')}</p>
          <div className="row g-2 mb-3">
            {[
              ['show_logo', t('app.invShowLogo')],
              ['show_company_name', t('app.invShowCompanyName')],
              ['show_company_address', t('app.invShowCompanyAddress')],
              ['show_company_phone', t('app.invShowCompanyPhone')],
              ['show_company_email', t('app.invShowCompanyEmail')],
              ['show_customer_name', t('app.invShowCustomerName')],
              ['show_customer_email', t('app.invShowCustomerEmail')],
              ['show_customer_phone', t('app.invShowCustomerPhone')],
              ['show_customer_address', t('app.invShowCustomerAddress')],
              ['show_notes', t('app.invShowNotes')],
              ['show_issue_date', t('app.invShowIssueDate')],
              ['show_due_date', t('app.invShowDueDate')],
              ['show_status', t('app.invShowStatus')],
            ].map(([key, label]) => (
              <div className="col-md-6" key={key}>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`inv_${key}`}
                    name={key}
                    checked={Boolean(invoiceSettings[key])}
                    onChange={onInvoiceSettingChange}
                  />
                  <label className="form-check-label" htmlFor={`inv_${key}`}>
                    {label}
                  </label>
                </div>
              </div>
            ))}
          </div>
          <FormField
            label={t('app.invCustomTitle')}
            name="custom_title"
            value={invoiceSettings.custom_title || ''}
            onChange={onInvoiceSettingChange}
          />
          <FormField
            label={t('app.invCustomFooter')}
            name="custom_footer"
            as="textarea"
            rows={2}
            value={invoiceSettings.custom_footer || ''}
            onChange={onInvoiceSettingChange}
          />
        </div>

        <button type="submit" className="btn btn-brand" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save settings'}
        </button>
      </form>

      {(isOwner || isAdmin || user) && !user?.is_platform_admin ? (
        <div className="panel mt-4 border-danger" style={{ maxWidth: 760, borderColor: 'rgba(220, 38, 38, 0.35)' }}>
          <h2 className="h5 text-danger mb-2">Danger zone</h2>
          <p className="text-secondary small mb-3">
            Permanent delete for testing from scratch. This cannot be undone.
          </p>
          <div className="d-flex flex-wrap gap-2">
            {isOwner ? (
              <button type="button" className="btn btn-outline-danger" onClick={() => openDanger('company')}>
                Delete this company & all data
              </button>
            ) : null}
            <button type="button" className="btn btn-danger" onClick={() => openDanger('account')}>
              Delete my account
            </button>
          </div>
        </div>
      ) : null}

      <Modal
        show={Boolean(dangerMode)}
        title={dangerMode === 'company' ? 'Delete company' : 'Delete account'}
        onClose={() => setDangerMode(null)}
        footer={
          <>
            <button type="button" className="btn btn-outline-brand" onClick={() => setDangerMode(null)}>
              Cancel
            </button>
            <button type="submit" form="danger-delete-form" className="btn btn-danger" disabled={dangerBusy}>
              {dangerBusy ? 'Deleting…' : 'Delete forever'}
            </button>
          </>
        }
      >
        <form id="danger-delete-form" onSubmit={onDangerSubmit}>
          <Alert
            type="warning"
            message={
              dangerMode === 'company'
                ? `This removes ${company?.name || 'the company'} and all customers, orders, invoices, tasks, and team links.`
                : 'This deletes your account and every company you own (including all business data).'
            }
          />
          <FormField
            label="Password"
            name="password"
            type="password"
            value={dangerForm.password}
            onChange={onDangerChange}
            required
            error={firstValidationError(dangerErrors, 'password')}
          />
          <FormField
            label='Type DELETE to confirm'
            name="confirmation"
            value={dangerForm.confirmation}
            onChange={onDangerChange}
            required
            error={firstValidationError(dangerErrors, 'confirmation')}
          />
        </form>
      </Modal>
    </>
  )
}
