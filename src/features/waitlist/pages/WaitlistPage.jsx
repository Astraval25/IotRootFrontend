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
        <div className="waitlist-shell">
          <div className="waitlist-copy">
            <p className="waitlist-tag">IotRoot Platform</p>
            <h1>One operations workspace for device identity, topic access, and broker visibility.</h1>
            <p className="waitlist-text">
              Bring onboarding, ACL management, live device status, and usage tracking into a single
              product surface built for teams shipping connected systems.
            </p>

            <div className="waitlist-stats">
              <div>
                <strong>Devices</strong>
                <span>Credential lifecycle and session visibility</span>
              </div>
              <div>
                <strong>Topics</strong>
                <span>Permission management aligned with broker paths</span>
              </div>
              <div>
                <strong>Realtime</strong>
                <span>Live dashboard updates over WebSocket streams</span>
              </div>
            </div>
          </div>

          <div className="waitlist-cta">
            <form className="waitlist-form" onSubmit={handleSubmit}>
              <label className="waitlist-field" htmlFor="waitlist-email">
                <span>Work Email</span>
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
                Start Registration
              </button>
            </form>

            <div className="waitlist-links">
              <Link to="/login">Sign in</Link>
              <Link to="/register">Full registration</Link>
              <Link to="/forgot-password">Recover account</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
