import { useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { resendOtp, verifyOtp } from '../api/authApi'
import { AuthField } from '../components/AuthField'
import { AuthFormMessage } from '../components/AuthFormMessage'
import { AuthLayout } from '../components/AuthLayout'

export function VerifyOtpPage() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const stateMessage = location.state?.message
  const defaultEmail = searchParams.get('email') || ''

  const [email, setEmail] = useState(defaultEmail)
  const [otp, setOtp] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState(stateMessage || '')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const canResendOtp = useMemo(() => email.trim().length > 0, [email])

  async function handleVerify(event) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setIsVerifying(true)

    try {
      const response = await verifyOtp({ email: email.trim(), otp: otp.trim() })
      setSuccessMessage(response.message || 'Account verified successfully')
    } catch (error) {
      setErrorMessage(error.message || 'Verification failed. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  async function handleResend() {
    if (!canResendOtp) {
      setErrorMessage('Enter your email first to resend OTP.')
      return
    }

    setErrorMessage('')
    setSuccessMessage('')
    setIsResending(true)

    try {
      const response = await resendOtp({ email: email.trim() })
      setSuccessMessage(response.message || 'OTP resent successfully')
    } catch (error) {
      setErrorMessage(error.message || 'Unable to resend OTP. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthLayout
      title="Verify access"
      subtitle="Enter the one-time passcode sent to your email to activate the workspace."
      highlights={[
        'Short verification before operations unlock',
        'Resend support without leaving the flow',
        'Secure team onboarding for production systems',
      ]}
      footerLinks={[
        { to: '/iotroot/login', label: 'Back to login' },
        { to: '/register', label: 'Need an account?' },
      ]}
    >
      <form className="auth-form" onSubmit={handleVerify}>
        <AuthField
          id="verify-email"
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          autoComplete="email"
        />

        <AuthField
          id="verify-otp"
          label="OTP"
          type="text"
          value={otp}
          onChange={(event) => setOtp(event.target.value)}
          placeholder="6-digit OTP"
          autoComplete="one-time-code"
        />

        <button className="auth-button" type="submit" disabled={isVerifying}>
          {isVerifying ? 'Verifying...' : 'Verify OTP'}
        </button>
      </form>

      <button className="auth-secondary-button" type="button" onClick={handleResend} disabled={isResending}>
        {isResending ? 'Resending...' : 'Resend OTP'}
      </button>

      <AuthFormMessage type="error" text={errorMessage} />
      <AuthFormMessage type="success" text={successMessage} />
    </AuthLayout>
  )
}
