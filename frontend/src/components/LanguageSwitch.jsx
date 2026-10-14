import { useLocale } from '../hooks/useLocale'

export default function LanguageSwitch({ className = '' }) {
  const { locale, locales, setLocale, t } = useLocale()

  return (
    <label className={`language-switch ${className}`.trim()}>
      <span className="visually-hidden">{t('common.language')}</span>
      <select
        className="form-select form-select-sm language-switch__select"
        value={locale}
        onChange={(event) => setLocale(event.target.value)}
        aria-label={t('common.language')}
      >
        {locales.map((item) => (
          <option key={item.code} value={item.code}>
            {item.short}
          </option>
        ))}
      </select>
    </label>
  )
}
