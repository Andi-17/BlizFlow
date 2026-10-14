import { useTheme } from '../hooks/useTheme'
import { useLocale } from '../hooks/useLocale'

export default function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme()
  const { t } = useLocale()
  const label = isDark ? t('common.lightMode') : t('common.darkMode')

  return (
    <button
      type="button"
      className={`btn btn-sm btn-outline-brand theme-toggle ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      <i className={`bi ${isDark ? 'bi-sun' : 'bi-moon-stars'}`} aria-hidden="true" />
    </button>
  )
}
