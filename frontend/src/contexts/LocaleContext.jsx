import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { LOCALES, translate } from '../i18n/dictionaries'

const LocaleContext = createContext(null)
const STORAGE_KEY = 'bizflow_locale'

function detectLocale() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'en' || saved === 'sq' || saved === 'de') return saved
  const browser = (navigator.language || 'en').toLowerCase()
  if (browser.startsWith('sq')) return 'sq'
  if (browser.startsWith('de')) return 'de'
  return 'en'
}

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    if (typeof window === 'undefined') return 'en'
    return detectLocale()
  })

  useEffect(() => {
    document.documentElement.lang = locale
    localStorage.setItem(STORAGE_KEY, locale)
  }, [locale])

  const setLocale = useCallback((next) => {
    if (next === 'en' || next === 'sq' || next === 'de') {
      setLocaleState(next)
    }
  }, [])

  const t = useCallback(
    (key, vars) => translate(locale, key, vars),
    [locale],
  )

  const value = useMemo(
    () => ({
      locale,
      locales: LOCALES,
      setLocale,
      t,
    }),
    [locale, setLocale, t],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export default LocaleContext
