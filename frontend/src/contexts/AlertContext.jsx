import { createContext, useCallback, useMemo, useState } from 'react'

const AlertContext = createContext(null)

let alertSeq = 0

export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState([])

  const dismissAlert = useCallback((id) => {
    setAlerts((current) => current.filter((alert) => alert.id !== id))
  }, [])

  const showAlert = useCallback(
    (message, type = 'info', timeout = 4500) => {
      const id = ++alertSeq
      setAlerts((current) => [...current, { id, message, type }])
      if (timeout > 0) {
        window.setTimeout(() => dismissAlert(id), timeout)
      }
      return id
    },
    [dismissAlert],
  )

  const value = useMemo(
    () => ({
      alerts,
      showAlert,
      dismissAlert,
      success: (message) => showAlert(message, 'success'),
      error: (message) => showAlert(message, 'danger'),
      info: (message) => showAlert(message, 'info'),
      warning: (message) => showAlert(message, 'warning'),
    }),
    [alerts, showAlert, dismissAlert],
  )

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>
}

export default AlertContext
