export default function StatCard({ label, value, icon = 'bi-bar-chart', tone = 'teal' }) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__icon">
        <i className={`bi ${icon}`} aria-hidden="true" />
      </div>
      <div className="stat-card__body">
        <p className="stat-card__label mb-1">{label}</p>
        <p className="stat-card__value mb-0">{value}</p>
      </div>
    </div>
  )
}
