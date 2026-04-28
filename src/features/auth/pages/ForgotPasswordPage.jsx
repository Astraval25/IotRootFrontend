import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { forgotPassword } from '../api/authApi'
import { AuthField } from '../components/AuthField'
import { AuthFormMessage } from '../components/AuthFormMessage'
import { AuthLayout } from '../components/AuthLayout'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      const trimmedEmail = email.trim()
      const response = await forgotPassword({ email: trimmedEmail })
      setSuccessMessage(response.message || 'Password reset OTP sent')
      navigate(`/reset-password?email=${encodeURIComponent(trimmedEmail)}`, {
        state: { message: response.message || 'OTP sent. Reset your password below.' },
      })
    } catch (error) {
      setErrorMessage(error.message || 'Unable to process request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Recover your account"
      subtitle="Request a reset code and continue restoring access without losing your setup."
      highlights={[
        'Recovery flow aligned with verification policy',
        'Works with existing workspace identity',
        'Fast path back into the operations dashboard',
      ]}
      footerLinks={[
        { to: '/login', label: 'Back to login' },
        { to: '/register', label: 'Create account' },
      ]}
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <AuthField
          id="forgot-email"
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          autoComplete="email"
        />

        <button className="auth-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
        </button>
      </form>

      <AuthFormMessage type="error" text={errorMessage} />
      <AuthFormMessage type="success" text={successMessage} />
    </AuthLayout>
  )
}
