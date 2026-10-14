import { useEffect } from 'react'

export default function Modal({
  show,
  title,
  children,
  onClose,
  footer,
  size = '',
}) {
  useEffect(() => {
    if (!show) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    document.body.classList.add('modal-open')
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('modal-open')
    }
  }, [show, onClose])

  if (!show) return null

  return (
    <div className="app-modal-root" role="presentation">
      <button
        type="button"
        className="app-modal-backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="modal fade show d-block app-modal"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
      >
        <div
          className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${size}`.trim()}
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5 mb-0">{title}</h2>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
            </div>
            <div className="modal-body">{children}</div>
            {footer ? <div className="modal-footer app-modal-footer">{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  )
}
