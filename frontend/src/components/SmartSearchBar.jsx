import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { reportService } from '../services/reportService'
import { useLocale } from '../hooks/useLocale'
import { getErrorMessage } from '../utils/formatters'

const TYPE_ICON = {
  customer: 'bi-person',
  product: 'bi-box-seam',
  order: 'bi-bag-check',
  invoice: 'bi-receipt',
}

const EXAMPLES = [
  'Gjeje Arbenin',
  'Sa stok kemi për vaj 5W-30?',
  'Ma hap faturën e fundit të Arbenit',
  'Shto 2 copë filter ajri',
]

export default function SmartSearchBar() {
  const navigate = useNavigate()
  const { t } = useLocale()
  const rootRef = useRef(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [payload, setPayload] = useState(null)

  useEffect(() => {
    const onDocClick = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setPayload(null)
      setError(null)
      setLoading(false)
      return undefined
    }

    let active = true
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await reportService.smartSearch(trimmed)
        if (active) {
          setPayload(response.data)
          setOpen(true)
        }
      } catch (err) {
        if (active) {
          setPayload(null)
          setError(getErrorMessage(err))
          setOpen(true)
        }
      } finally {
        if (active) setLoading(false)
      }
    }, 280)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query])

  const goToResult = (result) => {
    if (!result?.href) return
    setOpen(false)
    setQuery('')
    navigate(result.href)
  }

  const onSubmit = (event) => {
    event.preventDefault()
    const first = payload?.results?.[0]
    if (first) {
      goToResult(first)
    }
  }

  const results = payload?.results || []

  return (
    <div className="smart-search" ref={rootRef}>
      <form onSubmit={onSubmit} className="smart-search__form">
        <i className="bi bi-search smart-search__icon" aria-hidden="true" />
        <input
          type="search"
          className="form-control smart-search__input"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={t('app.smartSearchPlaceholder')}
          aria-label={t('app.smartSearchTitle')}
          autoComplete="off"
        />
        {loading ? <span className="smart-search__spinner" aria-hidden="true" /> : null}
      </form>

      {open ? (
        <div className="smart-search__panel">
          {query.trim().length < 2 ? (
            <div className="smart-search__hint">
              <p className="small text-secondary mb-2">{t('app.smartSearchHint')}</p>
              <div className="smart-search__examples">
                {EXAMPLES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    className="smart-search__chip"
                    onClick={() => setQuery(example)}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {error ? <p className="small text-danger mb-0 px-3 py-2">{error}</p> : null}

          {!error && query.trim().length >= 2 && !loading && !results.length ? (
            <p className="small text-secondary mb-0 px-3 py-2">{t('app.smartSearchEmpty')}</p>
          ) : null}

          {results.length ? (
            <ul className="smart-search__results">
              {results.map((result) => (
                <li key={`${result.type}-${result.id}`}>
                  <button type="button" className="smart-search__result" onClick={() => goToResult(result)}>
                    <span className={`smart-search__type smart-search__type--${result.type}`}>
                      <i className={`bi ${TYPE_ICON[result.type] || 'bi-search'}`} aria-hidden="true" />
                    </span>
                    <span className="smart-search__copy">
                      <strong>{result.title}</strong>
                      {result.subtitle ? <small>{result.subtitle}</small> : null}
                      {result.meta?.add_quantity ? (
                        <small>
                          {t('app.smartSearchAddStock', { qty: String(result.meta.add_quantity) })}
                        </small>
                      ) : null}
                    </span>
                    <i className="bi bi-arrow-right smart-search__arrow" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
