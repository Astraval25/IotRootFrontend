import { useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../api/authApi'
import { AuthField } from '../components/AuthField'
import { AuthFormMessage } from '../components/AuthFormMessage'
import { AuthLayout } from '../components/AuthLayout'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const stateMessage = location.state?.message || ''
  const initialEmail = searchParams.get('email') || ''

  const [email, setEmail] = useState(initialEmail)
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState(stateMessage)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirm password should match.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      })

      setSuccessMessage(response.message || 'Password reset successful')
      setOtp('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      setErrorMessage(error.message || 'Unable to reset password. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Use your OTP and create a new password."
      footerLinks={[
        { to: '/login', label: 'Back to login' },
        { to: '/forgot-password', label: 'Resend OTP' },
      ]}
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <AuthField
          id="reset-email"
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          autoComplete="email"
        />

        <AuthField
          id="reset-otp"
          label="OTP"
          type="text"
          value={otp}
          onChange={(event) => setOtp(event.target.value)}
          placeholder="Enter OTP"
          autoComplete="one-time-code"
        />

        <AuthField
          id="reset-new-password"
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder="Create new password"
          autoComplete="new-password"
        />

        <AuthField
          id="reset-confirm-password"
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Re-enter new password"
          autoComplete="new-password"
        />

        <button className="auth-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      <AuthFormMessage type="error" text={errorMessage} />
      <AuthFormMessage type="success" text={successMessage} />
    </AuthLayout>
  )
}
