import { useAlert } from '../hooks/useAlert'
import Alert from './Alert'

export default function GlobalAlerts() {
  const { alerts, dismissAlert } = useAlert()

  if (!alerts.length) return null

  return (
    <div className="global-alerts">
      {alerts.map((alert) => (
        <Alert
          key={alert.id}
          type={alert.type}
          message={alert.message}
          onClose={() => dismissAlert(alert.id)}
        />
      ))}
    </div>
  )
}
