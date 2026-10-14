import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { useAlert } from '../hooks/useAlert'
import { getErrorMessage } from '../utils/formatters'

export default function HomeTestTools() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { success, error: showError } = useAlert()
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const { data } = await api.get('/api/v1/dev/status')
        if (active) setEnabled(Boolean(data?.data?.enabled))
      } catch {
        if (active) setEnabled(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  if (!enabled) return null

  const wipeAll = async () => {
    const typed = window.prompt(
      'Fshi të gjitha llogaritë test (jo admin) dhe company-t e tyre?\nShkruaj DELETE ALL për konfirmim.',
    )
    if (!typed) return
    setBusy(true)
    try {
      const { data } = await api.post('/api/v1/dev/wipe-test-users', {
        confirmation: typed,
      })
      success(data?.message || 'Test accounts wiped')
      if (data?.data?.logged_out) {
        try {
          await logout()
        } catch {
          // session may already be gone
        }
      }
      navigate('/register')
    } catch (err) {
      showError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside className="home-test-tools" aria-label="Test tools">
      <div className="home-test-tools__card">
        <div className="home-test-tools__head">
          <span className="home-test-tools__icon" aria-hidden="true">
            <i className="bi bi-flask" />
          </span>
          <div>
            <strong>Test mode</strong>
            <p>Fshi llogaritë test dhe fillo signup nga e para.</p>
          </div>
        </div>
        <button type="button" className="btn btn-sm btn-outline-danger w-100" disabled={busy} onClick={wipeAll}>
          {busy ? 'Duke fshirë…' : 'Wipe all test accounts'}
        </button>
      </div>
    </aside>
  )
}
