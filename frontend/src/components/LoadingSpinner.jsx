import { useLocale } from '../hooks/useLocale'

export default function LoadingSpinner({ label, fullPage = false }) {
  const { t } = useLocale()
  const resolvedLabel = label || t('common.loading')
  const content = (
    <div className="d-flex flex-column align-items-center justify-content-center gap-3 py-5">
      <div className="spinner-border text-brand" role="status" aria-label={resolvedLabel} />
      <span className="text-secondary small">{resolvedLabel}</span>
    </div>
  )

  if (fullPage) {
    return <div className="page-loader">{content}</div>
  }

  return content
}
