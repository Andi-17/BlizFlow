import { useLocale } from '../hooks/useLocale'

export default function Pagination({ meta, onPageChange }) {
  const { t } = useLocale()
  if (!meta || !meta.last_page || meta.last_page <= 1) return null

  const current = meta.current_page
  const last = meta.last_page

  return (
    <nav className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3" aria-label="Pagination">
      <p className="mb-0 small text-secondary">
        {t('common.showing', { from: meta.from ?? 0, to: meta.to ?? 0, total: meta.total ?? 0 })}
      </p>
      <ul className="pagination mb-0">
        <li className={`page-item ${current <= 1 ? 'disabled' : ''}`}>
          <button type="button" className="page-link" onClick={() => onPageChange(current - 1)} disabled={current <= 1}>
            {t('common.prev')}
          </button>
        </li>
        <li className="page-item disabled">
          <span className="page-link">
            {current} / {last}
          </span>
        </li>
        <li className={`page-item ${current >= last ? 'disabled' : ''}`}>
          <button type="button" className="page-link" onClick={() => onPageChange(current + 1)} disabled={current >= last}>
            {t('common.next')}
          </button>
        </li>
      </ul>
    </nav>
  )
}
