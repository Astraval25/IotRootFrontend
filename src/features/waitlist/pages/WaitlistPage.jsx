import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export function WaitlistPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const trimmedEmail = email.trim()
    navigate(`/register?email=${encodeURIComponent(trimmedEmail)}`, {
      state: { message: 'Continue registration by setting your password.' },
    })
  }

  return (
    <main className="waitlist-page">
      <section className="waitlist-card">
        <p className="waitlist-tag">IotRoot Platform</p>
        <h1>Launch-ready IoT stack for teams that ship fast.</h1>
        <p className="waitlist-text">
          Join the waitlist to get early access to secure device onboarding, telemetry controls, and
          release pipelines from one dashboard.
        </p>

        <form className="waitlist-form" onSubmit={handleSubmit}>
          <label className="waitlist-field" htmlFor="waitlist-email">
            <span>Email</span>
            <input
              id="waitlist-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              required
            />
          </label>

          <button className="waitlist-button" type="submit">
            Continue
          </button>
        </form>

        <div className="waitlist-links">
          <Link to="/login">Sign in</Link>
          <Link to="/register">Full registration page</Link>
          <Link to="/forgot-password">Forgot password</Link>
        </div>
      </section>
    </main>
  )
}
