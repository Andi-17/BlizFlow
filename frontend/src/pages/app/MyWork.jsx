import { useEffect, useState } from 'react'
import StatCard from '../../components/StatCard'
import LoadingSpinner from '../../components/LoadingSpinner'
import Alert from '../../components/Alert'
import DataTable from '../../components/DataTable'
import { performanceService } from '../../services/performanceService'
import { usePermissions } from '../../hooks/usePermissions'
import { useLocale } from '../../hooks/useLocale'
import { formatCurrency, formatDate, getErrorMessage } from '../../utils/formatters'

const periods = [
  { id: 'day', label: 'Today' },
  { id: 'month', label: 'This month' },
  { id: 'year', label: 'This year' },
]

export default function MyWork() {
  const { canViewTeamPerformance, isWorker } = usePermissions()
  const { t } = useLocale()
  const [period, setPeriod] = useState('month')
  const [mine, setMine] = useState(null)
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const mineRes = await performanceService.mine({ period })
        if (!active) return
        setMine(mineRes.data)
        if (canViewTeamPerformance) {
          const teamRes = await performanceService.team({ period })
          if (active) setTeam(teamRes.data)
        } else {
          setTeam(null)
        }
      } catch (err) {
        if (active) setError(getErrorMessage(err))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [period, canViewTeamPerformance])

  const summary = mine?.summary || {}

  const taskColumns = [
    { key: 'title', label: 'Task' },
    { key: 'status', label: 'Status', render: (row) => <span className="text-capitalize">{row.status}</span> },
    { key: 'updated_at', label: 'Updated', render: (row) => formatDate(row.updated_at) },
  ]

  const orderColumns = [
    { key: 'order_number', label: 'Order' },
    { key: 'status', label: 'Status', render: (row) => <span className="text-capitalize">{row.status}</span> },
    { key: 'total', label: 'Total', render: (row) => formatCurrency(row.total) },
  ]

  const teamColumns = [
    { key: 'name', label: 'Worker', render: (row) => <strong>{row.name}</strong> },
    { key: 'role', label: 'Role' },
    { key: 'tasks_completed', label: 'Tasks done' },
    { key: 'orders_completed', label: 'Orders done' },
    { key: 'order_revenue', label: 'Revenue', render: (row) => formatCurrency(row.order_revenue) },
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">{isWorker ? 'Personal board' : 'Team operations'}</p>
          <h1>{canViewTeamPerformance ? t('app.workPerf') : t('app.myWork')}</h1>
          <p className="text-secondary mb-0">
            Track completed work by day, month, or year. Workers only see their own results.
          </p>
        </div>
        <div className="btn-group period-switch">
          {periods.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`btn ${period === item.id ? 'btn-brand' : 'btn-outline-brand'}`}
              onClick={() => setPeriod(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <Alert type="danger" message={error} /> : null}
      {loading ? <LoadingSpinner /> : null}

      {!loading && mine ? (
        <>
          <div className="row g-3 mb-4">
            <div className="col-sm-6 col-xl-3">
              <StatCard label="Tasks completed" value={summary.tasks_completed ?? 0} icon="bi-check2-square" />
            </div>
            <div className="col-sm-6 col-xl-3">
              <StatCard label="Open tasks" value={summary.tasks_open ?? 0} icon="bi-list-task" tone="ink" />
            </div>
            <div className="col-sm-6 col-xl-3">
              <StatCard label="Orders completed" value={summary.orders_completed ?? 0} icon="bi-cart-check" tone="amber" />
            </div>
            <div className="col-sm-6 col-xl-3">
              <StatCard label="My revenue" value={formatCurrency(summary.order_revenue)} icon="bi-currency-euro" />
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-lg-6">
              <div className="panel h-100">
                <h2 className="h5 mb-3">Recent tasks</h2>
                <DataTable columns={taskColumns} rows={mine.recent_tasks || []} emptyTitle="No tasks in this period" />
              </div>
            </div>
            <div className="col-lg-6">
              <div className="panel h-100">
                <h2 className="h5 mb-3">Recent orders</h2>
                <DataTable columns={orderColumns} rows={mine.recent_orders || []} emptyTitle="No orders assigned" />
              </div>
            </div>
          </div>

          {canViewTeamPerformance && team ? (
            <div className="panel">
              <h2 className="h5 mb-3">Team performance ({period})</h2>
              <DataTable columns={teamColumns} rows={team.workers || []} emptyTitle="No team data yet" />
            </div>
          ) : null}
        </>
      ) : null}
    </>
  )
}
