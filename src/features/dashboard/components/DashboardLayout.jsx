import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearSession } from '../../auth/session/authSession'
import { useWorkspace } from '../realtime/useWorkspace'

function Icon({ devices = false }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      {devices ? <><rect x="5" y="5" width="14" height="14" rx="3" /><path d="M9 1v4m6-4v4M9 19v4m6-4v4M1 9h4m-4 6h4m14-6h4m-4 6h4" /><rect x="9" y="9" width="6" height="6" rx="1" /></> : <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>}
    </svg>
  )
}

export function DashboardLayout() {
  const navigate = useNavigate()
  const { statusStream } = useWorkspace()
  const navClass = ({ isActive }) => 'dashboard-nav-link' + (isActive ? ' active' : '')
  return (
    <main className="dashboard-page">
      <a className="skip-link" href="#workspace-content">Skip to content</a>
      <aside className="dashboard-sidebar">
        <NavLink to="/iotroot/dashboard" className="dashboard-brand">
          <span className="dashboard-brand-symbol" aria-hidden="true">iR</span>IotRoot<span className="dashboard-brand-cloud">Cloud</span>
        </NavLink>
        <span className="dashboard-nav-caption">WORKSPACE</span>
        <nav className="dashboard-nav" aria-label="Main navigation">
          <NavLink to="/iotroot/dashboard" end className={navClass}><Icon />Overview</NavLink>
          <NavLink to="/iotroot/dashboard/devices" className={navClass}><Icon devices />Devices</NavLink>
          <NavLink to="/iotroot/dashboard/topics" className={navClass}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M5 6h14M5 12h14M5 18h14" /><circle cx="9" cy="6" r="2" fill="white" /><circle cx="15" cy="12" r="2" fill="white" /><circle cx="9" cy="18" r="2" fill="white" /></svg>Topics</NavLink>
        </nav>
        <button className="dashboard-logout" type="button" onClick={() => { clearSession(); navigate('/iotroot/login', { replace: true }) }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M9 4H4v16h5m5-12 4 4-4 4m-6-4h12" /></svg>
          Sign out
        </button>
      </aside>
      <section className="dashboard-main">
        <header className="dashboard-topbar"><span>My workspace</span><div className="dashboard-top-actions"><span className={`workspace-stream ${statusStream === 'connected' ? 'is-live' : ''}`} role="status"><i aria-hidden="true" />{statusStream === 'connected' ? 'Live' : statusStream === 'connecting' ? 'Connecting' : 'Reconnecting'}</span><span className="dashboard-workspace-avatar" aria-label="IotRoot workspace">IR</span></div></header>
        <section className="dashboard-content" id="workspace-content" tabIndex={-1}><Outlet /></section>
      </section>
    </main>
  )
}
