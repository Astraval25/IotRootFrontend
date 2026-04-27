import { Link } from 'react-router-dom'

export function AuthLayout({ title, subtitle, children, footerLinks = [] }) {
  return (
    <main className="auth-page">
      <section className="auth-layout">
        <aside className="auth-brand">
          <p className="auth-brand-kicker">IotRoot</p>
          <h1>Secure access for your connected product lifecycle.</h1>
          <p>
            Register and verify your account to manage devices, telemetry, and deployments from one
            control plane.
          </p>
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
