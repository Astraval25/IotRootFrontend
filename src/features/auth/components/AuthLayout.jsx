import { Link } from 'react-router-dom'

const defaultHighlights = [
  'Broker-aware device operations',
  'Account verification and recovery flows',
  'Live fleet visibility in one workspace',
]

export function AuthLayout({ title, subtitle, children, footerLinks = [], highlights = defaultHighlights }) {
  return (
    <main className="auth-page">
      <section className="auth-layout">
        <aside className="auth-brand">
          <p className="auth-brand-kicker">IotRoot Control Plane</p>
          <h1>Operate connected products with secure access, live visibility, and cleaner workflows.</h1>
          <p>
            Bring together account access, device management, topic permissions, and usage tracking in
            one operational surface.
          </p>

          <div className="auth-brand-metrics">
            <div>
              <strong>Secure</strong>
              <span>OTP-based onboarding and recovery</span>
            </div>
            <div>
              <strong>Unified</strong>
              <span>Devices, topics, and traffic in one workspace</span>
            </div>
            <div>
              <strong>Live</strong>
              <span>Realtime session and usage feedback</span>
            </div>
          </div>

          <ul className="auth-brand-list">
            {highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </aside>

        <section className="auth-card">
          <h2>{title}</h2>
          <p className="auth-subtitle">{subtitle}</p>
          {children}

          {footerLinks.length > 0 ? (
            <div className="auth-links">
              {footerLinks.map((link) => (
                <Link key={link.to} to={link.to}>
                  {link.label}
                </Link>
              ))}
            </div>
          ) : null}
        </section>
      </section>
    </main>
  )
}
