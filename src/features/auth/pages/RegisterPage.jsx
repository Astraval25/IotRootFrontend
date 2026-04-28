import { useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { registerUser } from '../api/authApi'
import { AuthField } from '../components/AuthField'
import { AuthFormMessage } from '../components/AuthFormMessage'
import { AuthLayout } from '../components/AuthLayout'

export function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const initialEmail = searchParams.get('email') || ''
  const initialMessage = location.state?.message || ''
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [infoMessage] = useState(initialMessage)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const trimmedEmail = email.trim()
      const response = await registerUser({ email: trimmedEmail, password })

      navigate(`/verify-otp?email=${encodeURIComponent(trimmedEmail)}`, {
        replace: true,
        state: { message: response.message || 'Registered successfully. Verify OTP next.' },
      })
    } catch (error) {
      setErrorMessage(error.message || 'Unable to register. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create your workspace"
      subtitle="Set up your account and verify it before opening the operations workspace."
      highlights={[
        'Structured onboarding for device teams',
        'Verification flow aligned with production access control',
        'Fast handoff into live device operations',
      ]}
      footerLinks={[
        { to: '/login', label: 'Already have an account? Sign in' },
        { to: '/', label: 'Back to waitlist' },
      ]}
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <AuthField
          id="register-email"
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          autoComplete="email"
        />

        <AuthField
          id="register-password"
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Create a strong password"
          autoComplete="new-password"
        />

        <button className="auth-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>
      </form>

      <AuthFormMessage type="success" text={infoMessage} />
      <AuthFormMessage type="error" text={errorMessage} />
    </AuthLayout>
  )
}
