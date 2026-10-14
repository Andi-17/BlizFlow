import { useEffect, useState } from 'react'
import StatCard from '../../components/StatCard'
import LoadingSpinner from '../../components/LoadingSpinner'
import Alert from '../../components/Alert'
import { adminService } from '../../services/adminService'
import { getErrorMessage } from '../../utils/formatters'
import { useLocale } from '../../hooks/useLocale'

export default function AdminDashboard() {
  const { t } = useLocale()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const response = await adminService.stats()
        if (active) setStats(response.data)
      } catch (err) {
        if (active) setError(getErrorMessage(err))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <Alert type="danger" message={error} />

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{t('admin.platformOverview')}</h1>
          <p className="text-secondary mb-0">BizFlow administration</p>
        </div>
      </div>
      <div className="row g-3">
        {Object.entries(stats || {}).map(([key, value]) => (
          <div className="col-sm-6 col-xl-3" key={key}>
            <StatCard
              label={key.replaceAll('_', ' ')}
              value={typeof value === 'number' ? value : String(value ?? '—')}
              icon="bi-bar-chart"
            />
          </div>
        ))}
      </div>
    </>
  )
}
