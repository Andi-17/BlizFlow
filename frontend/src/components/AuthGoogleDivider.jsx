import GoogleAuthButton from './GoogleAuthButton'

export default function AuthGoogleDivider({ googleLabel, orLabel }) {
  return (
    <div className="auth-google">
      <GoogleAuthButton label={googleLabel} />
      <p className="auth-google__or">{orLabel}</p>
    </div>
  )
}
