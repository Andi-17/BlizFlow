import { useLocale } from '../hooks/useLocale'

export default function EmptyState({
  title,
  message,
  action,
  icon = 'bi-inbox',
}) {
  const { t } = useLocale()
  return (
    <div className="empty-state text-center py-5 px-3">
      <div className="empty-state-icon mb-3">
        <i className={`bi ${icon}`} aria-hidden="true" />
      </div>
      <h3 className="h5 mb-2">{title || t('common.emptyTitle')}</h3>
      <p className="text-secondary mb-3 mx-auto" style={{ maxWidth: 420 }}>
        {message || t('common.emptyMessage')}
      </p>
      {action}
    </div>
  )
}
