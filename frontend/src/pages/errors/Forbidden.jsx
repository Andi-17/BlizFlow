import { Link } from 'react-router-dom'
import { useLocale } from '../../hooks/useLocale'

export default function Forbidden() {
  const { t } = useLocale()
  return (
    <div className="container py-5 text-center">
      <h1 className="display-5">{t('auth.forbidden')}</h1>
      <p className="text-secondary">{t('auth.forbiddenLede')}</p>
      <Link to="/app" className="btn btn-brand">{t('auth.backToApp')}</Link>
    </div>
  )
}
