import { Link } from 'react-router-dom'

export default function BillingCancel() {
  return (
    <div className="container py-5" style={{ maxWidth: 560 }}>
      <div className="panel text-center page-enter">
        <div className="empty-state-icon mb-3">
          <i className="bi bi-x-lg" aria-hidden="true" />
        </div>
        <h1 className="h3">Checkout canceled</h1>
        <p className="text-secondary">No charge was made. You can pick a plan whenever you are ready.</p>
        <div className="d-flex gap-2 justify-content-center">
          <Link to="/onboarding/plan" className="btn btn-brand">
            Choose plan
          </Link>
          <Link to="/app" className="btn btn-outline-brand">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
