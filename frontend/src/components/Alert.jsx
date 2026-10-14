export default function Alert({ type = 'info', message, onClose, className = '' }) {
  if (!message) return null

  return (
    <div className={`alert alert-${type} alert-dismissible fade show ${className}`} role="alert">
      {message}
      {onClose ? (
        <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
      ) : null}
    </div>
  )
}
