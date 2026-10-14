import { Link } from 'react-router-dom'
import { useLocale } from '../../hooks/useLocale'

export default function NotFound() {
  const { t } = useLocale()
  return (
    <div className="container py-5 text-center">
      <h1 className="display-5">{t('auth.notFound')}</h1>
      <p className="text-secondary">{t('auth.notFoundLede')}</p>
      <Link to="/" className="btn btn-brand">{t('auth.goHome')}</Link>
    </div>
  )
}
