import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearSession } from '../../auth/session/authSession'

export function DashboardLayout() {
  const navigate = useNavigate()

  function handleLogout() {
    clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <main className="dashboard-page">
      <aside className="dashboard-sidebar">
        <p className="dashboard-brand">IotRoot</p>
        <nav className="dashboard-nav">
          <NavLink
            to="/iotroot/dashboard"
            end
            className={({ isActive }) => (isActive ? 'dashboard-nav-link active' : 'dashboard-nav-link')}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/iotroot/dashboard/devices"
            className={({ isActive }) => (isActive ? 'dashboard-nav-link active' : 'dashboard-nav-link')}
          >
            Operations
          </NavLink>
        </nav>

        <button className="dashboard-logout" type="button" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <h1>IotRoot Operations</h1>
          <div className="dashboard-top-actions">
            <button type="button" className="dashboard-chip">
              Workspace
            </button>
            <button type="button" className="dashboard-chip">
              Live Stream
            </button>
            <button type="button" className="dashboard-chip">
              Broker
            </button>
          </div>
        </header>

        <section className="dashboard-content">
          <Outlet />
        </section>
      </section>
    </main>
  )
}
