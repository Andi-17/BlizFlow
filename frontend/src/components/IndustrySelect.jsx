import { useEffect, useId, useMemo, useRef, useState } from 'react'

function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export default function IndustrySelect({
  id,
  name = 'industry',
  value = '',
  industries = [],
  onChange,
  placeholder = 'Search business type…',
  required = false,
  disabled = false,
  error = false,
  className = '',
}) {
  const generatedId = useId()
  const controlId = id || generatedId
  const listboxId = `${controlId}-listbox`
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(0)

  const selectedIndustry = useMemo(
    () => industries.find((industry) => industry.slug === value) || null,
    [industries, value],
  )

  const filteredIndustries = useMemo(() => {
    const needle = normalizeSearchText(query)
    if (!needle) return industries
    return industries.filter((industry) => {
      const haystack = [industry.name, industry.slug, industry.description]
        .map(normalizeSearchText)
        .join(' ')
      return haystack.includes(needle)
    })
  }, [industries, query])

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  const emitChange = (industrySlug) => {
    onChange?.({ target: { name, value: industrySlug } })
  }

  const chooseIndustry = (industry) => {
    emitChange(industry.slug)
    setQuery('')
    setOpen(false)
  }

  const onInputChange = (event) => {
    setQuery(event.target.value)
    setOpen(true)
    setHighlightIndex(0)
  }

  const onKeyDown = (event) => {
    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) {
      setOpen(true)
      return
    }
    if (event.key === 'Escape') {
      setOpen(false)
      setQuery('')
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightIndex((current) =>
        Math.min(current + 1, Math.max(filteredIndustries.length - 1, 0)),
      )
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightIndex((current) => Math.max(current - 1, 0))
      return
    }
    if (event.key === 'Enter' && open && filteredIndustries[highlightIndex]) {
      event.preventDefault()
      chooseIndustry(filteredIndustries[highlightIndex])
    }
  }

  return (
    <div className={`industry-select ${className}`.trim()} ref={rootRef}>
      <input type="hidden" name={name} value={value || ''} required={required} />

      <div className="industry-select__control">
        <i className="bi bi-search industry-select__icon" aria-hidden="true" />
        <input
          id={controlId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-required={required || undefined}
          className={`form-control industry-select__input ${error ? 'is-invalid' : ''}`.trim()}
          value={query}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          required={required && !value}
          onChange={onInputChange}
          onFocus={() => {
            setOpen(true)
            setHighlightIndex(0)
          }}
          onKeyDown={onKeyDown}
        />
        {selectedIndustry ? (
          <button
            type="button"
            className="industry-select__clear"
            aria-label="Clear"
            disabled={disabled}
            onClick={() => {
              emitChange('')
              setQuery('')
              setOpen(false)
            }}
          >
            <i className="bi bi-x" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className="industry-select__grid" id={listboxId} role="listbox">
        {filteredIndustries.length === 0 ? (
          <div className="industry-select__empty">No matches.</div>
        ) : (
          filteredIndustries.map((industry, index) => (
            <button
              key={industry.slug}
              type="button"
              role="option"
              aria-selected={industry.slug === value}
              className={`industry-select__tile ${index === highlightIndex ? 'is-active' : ''} ${industry.slug === value ? 'is-selected' : ''}`.trim()}
              disabled={disabled}
              onMouseEnter={() => setHighlightIndex(index)}
              onClick={() => chooseIndustry(industry)}
            >
              <i className={`bi ${industry.icon || 'bi-building'}`} aria-hidden="true" />
              <span>{industry.name}</span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
