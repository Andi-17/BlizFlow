import { useState } from 'react'
import { useLocale } from '../hooks/useLocale'

export default function SearchFilter({
  value = '',
  onSearch,
  placeholder,
  children,
}) {
  const { t } = useLocale()
  const [draft, setDraft] = useState(value)

  const submit = (event) => {
    event.preventDefault()
    onSearch?.(draft.trim())
  }

  return (
    <form className="search-filter row g-2 align-items-end mb-3" onSubmit={submit}>
      <div className="col-md-5 col-lg-4">
        <label className="form-label small text-secondary mb-1">{t('common.search')}</label>
        <div className="input-group">
          <span className="input-group-text">
            <i className="bi bi-search" aria-hidden="true" />
          </span>
          <input
            type="search"
            className="form-control"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={placeholder || `${t('common.search')}…`}
          />
        </div>
      </div>
      {children}
      <div className="col-auto">
        <button type="submit" className="btn btn-brand">
          {t('common.apply')}
        </button>
      </div>
    </form>
  )
}
