import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser } from '../api/authApi'
import { AuthField } from '../components/AuthField'
import { AuthFormMessage } from '../components/AuthFormMessage'
import { AuthLayout } from '../components/AuthLayout'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await loginUser({ email: email.trim(), password })
      setSuccessMessage(response.message || 'Login successful')
      navigate('/iotroot/dashboard', { replace: true })
    } catch (error) {
      setErrorMessage(error.message || 'Unable to login. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue managing devices, topic access, and live broker activity."
      highlights={[
        'Review connected device health from one dashboard',
        'Generate publish and subscribe test commands instantly',
        'Track usage movement while the workspace stays live',
      ]}
      footerLinks={[
        { to: '/register', label: 'Create account' },
        { to: '/forgot-password', label: 'Forgot password?' },
      ]}
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <AuthField
          id="login-email"
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          autoComplete="email"
        />

        <AuthField
          id="login-password"
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
        />

        <button className="auth-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <AuthFormMessage type="error" text={errorMessage} />
      <AuthFormMessage type="success" text={successMessage} />

      {errorMessage.includes('not verified') ? (
        <Link className="auth-inline-link" to={`/verify-otp?email=${encodeURIComponent(email.trim())}`}>
          Verify OTP
        </Link>
      ) : null}
    </AuthLayout>
  )
}
