import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { filterCountries, groupCountriesByLetter, regionForCountry } from '../utils/regions'

export default function CountrySelect({
  id,
  name = 'country',
  value = '',
  onChange,
  onCountryChange,
  placeholder = 'Search country…',
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

  const selectedCountry = useMemo(() => (value ? regionForCountry(value) : null), [value])

  const filteredCountries = useMemo(() => filterCountries(query), [query])
  const groupedCountries = useMemo(
    () => groupCountriesByLetter(filteredCountries),
    [filteredCountries],
  )
  const flatCountries = filteredCountries

  useEffect(() => {
    if (!open) {
      setQuery(selectedCountry?.name || '')
    }
  }, [selectedCountry, open])

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
        setQuery(selectedCountry?.name || '')
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [selectedCountry])

  const emitChange = (countryCode) => {
    const syntheticEvent = {
      target: { name, value: countryCode },
    }
    onChange?.(syntheticEvent)
    onCountryChange?.(countryCode)
  }

  const chooseCountry = (country) => {
    emitChange(country.code)
    setQuery(country.name)
    setOpen(false)
  }

  const onInputChange = (event) => {
    const nextQuery = event.target.value
    setQuery(nextQuery)
    setOpen(true)
    setHighlightIndex(0)
    if (!nextQuery.trim() && value) {
      emitChange('')
    }
  }

  const onInputFocus = () => {
    setOpen(true)
    setQuery('')
    setHighlightIndex(0)
  }

  const onKeyDown = (event) => {
    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) {
      setOpen(true)
      return
    }

    if (event.key === 'Escape') {
      setOpen(false)
      setQuery(selectedCountry?.name || '')
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightIndex((current) => Math.min(current + 1, Math.max(flatCountries.length - 1, 0)))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightIndex((current) => Math.max(current - 1, 0))
      return
    }

    if (event.key === 'Enter' && open && flatCountries[highlightIndex]) {
      event.preventDefault()
      chooseCountry(flatCountries[highlightIndex])
    }
  }

  let optionOffset = 0

  return (
    <div className={`country-select ${className}`.trim()} ref={rootRef}>
      <input type="hidden" name={name} value={value || ''} required={required} />
      <div className="country-select__control">
        <i className="bi bi-search country-select__icon" aria-hidden="true" />
        <input
          id={controlId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-required={required || undefined}
          className={`form-control country-select__input ${error ? 'is-invalid' : ''}`.trim()}
          value={open ? query : selectedCountry?.name || query}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          required={required && !value}
          onChange={onInputChange}
          onFocus={onInputFocus}
          onKeyDown={onKeyDown}
        />
        {selectedCountry ? (
          <span className="country-select__currency" title="Billing currency">
            {selectedCountry.currency}
          </span>
        ) : null}
        <button
          type="button"
          className="country-select__toggle"
          tabIndex={-1}
          aria-label="Toggle country list"
          disabled={disabled}
          onClick={() => {
            setOpen((current) => !current)
            if (!open) {
              setQuery('')
              setHighlightIndex(0)
            }
          }}
        >
          <i className={`bi ${open ? 'bi-chevron-up' : 'bi-chevron-down'}`} aria-hidden="true" />
        </button>
      </div>

      {open ? (
        <div className="country-select__menu" id={listboxId} role="listbox">
          {flatCountries.length === 0 ? (
            <div className="country-select__empty">No countries match your search.</div>
          ) : (
            groupedCountries.map((group) => {
              const groupStart = optionOffset
              const nodes = (
                <div key={group.letter} className="country-select__group">
                  <div className="country-select__letter">{group.letter}</div>
                  {group.countries.map((country, countryIndex) => {
                    const flatIndex = groupStart + countryIndex
                    const isActive = flatIndex === highlightIndex
                    const isSelected = country.code === value
                    return (
                      <button
                        key={country.code}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={`country-select__option ${isActive ? 'is-active' : ''} ${isSelected ? 'is-selected' : ''}`.trim()}
                        onMouseEnter={() => setHighlightIndex(flatIndex)}
                        onClick={() => chooseCountry(country)}
                      >
                        <span className="country-select__name">{country.name}</span>
                        <span className="country-select__meta">
                          {country.code} · {country.currency}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )
              optionOffset += group.countries.length
              return nodes
            })
          )}
        </div>
      ) : null}
    </div>
  )
}
