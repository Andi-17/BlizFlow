import { useState } from 'react'
import { Link } from 'react-router-dom'
import Alert from '../../components/Alert'
import { authService } from '../../services/authService'
import { useAuth } from '../../hooks/useAuth'
import { getErrorMessage } from '../../utils/formatters'

export default function VerifyEmail() {
  const { user, refreshUser } = useAuth()
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)

  const resend = async () => {
    setSending(true)
    setError(null)
    setMessage(null)
    try {
      const response = await authService.sendVerificationEmail()
      setMessage(response.message || 'Verification email sent')
      await refreshUser()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSending(false)
    }
  }

  const verified = Boolean(user?.email_verified_at)

  return (
    <>
      <h1 className="mb-1">Verify your email</h1>
      <p className="text-secondary mb-4">
        {verified
          ? 'Your email is verified. You can continue to the app.'
          : 'Check your inbox for a verification link, or resend it below.'}
      </p>
      {message ? <Alert type="success" message={message} /> : null}
      {error ? <Alert type="danger" message={error} /> : null}
      {verified ? (
        <Link to="/app" className="btn btn-brand w-100">
          Continue to app
        </Link>
      ) : (
        <button type="button" className="btn btn-brand w-100" onClick={resend} disabled={sending}>
          {sending ? 'Sending…' : 'Resend verification email'}
        </button>
      )}
      <p className="small mt-3 mb-0">
        <Link to="/login">Back to sign in</Link>
      </p>
    </>
  )
}
