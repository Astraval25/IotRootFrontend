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
      subtitle="Enter the code sent to your email."
      footerLinks={[
        { to: '/iotroot/login', label: 'Back to login' },
        { to: '/register', label: 'Need an account?' },
      ]}
    >
      <form className="grid gap-4" onSubmit={handleVerify}>
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

        <button className="mt-1 min-h-11 rounded bg-[#1d2f6f] px-4 text-sm font-semibold text-white hover:bg-[#8390fa] disabled:opacity-50" type="submit" disabled={isVerifying}>
          {isVerifying ? 'Verifying...' : 'Verify OTP'}
        </button>
      </form>

      <button className="mt-3 min-h-11 w-full rounded border border-slate-300 bg-white px-4 text-sm font-semibold text-[#1d2f6f] hover:bg-[#eef0ff] disabled:opacity-50" type="button" onClick={handleResend} disabled={isResending}>
        {isResending ? 'Resending...' : 'Resend OTP'}
      </button>

      <AuthFormMessage type="error" text={errorMessage} />
      <AuthFormMessage type="success" text={successMessage} />
    </AuthLayout>
  )
}
