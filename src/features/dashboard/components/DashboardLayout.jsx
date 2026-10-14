import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearSession } from "../../auth/session/authSession";
import { useWorkspace } from "../realtime/useWorkspace";

function Icon({ devices = false, settings = false }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      {settings ? (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.4 4a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.17.38.38.72.7 1 .3.27.7.4 1.1.4h.09v4h-.09a1.7 1.7 0 0 0-1.8.6Z" />
        </>
      ) : devices ? (
        <>
          <rect x="5" y="5" width="14" height="14" rx="3" />
          <path d="M9 1v4m6-4v4M9 19v4m6-4v4M1 9h4m-4 6h4m14-6h4m-4 6h4" />
          <rect x="9" y="9" width="6" height="6" rx="1" />
        </>
      ) : (
        <>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </>
      )}
    </svg>
  );
}

export function DashboardLayout() {
  const navigate = useNavigate();
  const { statusStream } = useWorkspace();
  const navClass = ({ isActive }) =>
    `flex min-h-9 items-center gap-2.5 border-l-4 px-4 py-2 text-[13px] no-underline ${isActive ? "border-[#8390fa] bg-[#eef0ff] font-bold text-[#1d2f6f]" : "border-transparent text-[#232f3e] hover:bg-[#f2f3f3]"}`;
  return (
    <main className="grid min-h-dvh grid-cols-[220px_minmax(0,1fr)] grid-rows-[36px_minmax(0,1fr)] [grid-template-areas:'header_header''sidebar_main'] bg-[#f2f3f3] max-[760px]:grid-cols-1 max-[760px]:grid-rows-[36px_auto_1fr] max-[760px]:[grid-template-areas:'header''sidebar''main']">
      <a className="fixed left-2 top-2 z-[100] -translate-y-[160%] bg-white px-4 py-2.5 focus:translate-y-0" href="#workspace-content">
        Skip to content
      </a>
      <header className="sticky top-0 z-20 flex items-center gap-[18px] bg-[#1d2f6f] px-[15px] text-xs text-white shadow-[0_1px_#8390fa] [grid-area:header]">
        <NavLink to="/iotroot/dashboard" className="inline-flex items-center gap-[7px] text-[15px] font-bold text-white no-underline">
          <span className="text-[11px] text-[#fac748]" aria-hidden="true">iR</span>
          IoTRoot
        </NavLink>
        <div className="flex items-center gap-[7px] border-l border-white/25 pl-4 font-semibold max-[760px]:hidden"><i className="size-2.5 rounded-sm border-2 border-[#fac748]" aria-hidden="true" /> IoT Console</div>
        <div className="mr-auto flex h-[26px] w-[min(450px,42vw)] items-center gap-2 border border-[#8390fa] bg-[#17265b] px-[9px] text-[#dce0ff] max-[760px]:hidden" aria-label="Console search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
          <span>Search devices and services</span>
          <kbd>⌘ K</kbd>
        </div>
        <div className="flex items-center gap-3.5 max-[760px]:ml-auto">
          <span className="inline-flex items-center gap-1.5 text-[#dce0ff]"><i className={`size-[7px] rounded-full ${statusStream === "connected" ? "bg-[#8390fa]" : "bg-[#fac748]"}`} />{statusStream === "connected" ? "Live" : "Connecting"}</span>
          <span className="grid size-6 place-items-center rounded-full bg-[#8390fa] text-[9px] font-bold" aria-label="IoTRoot workspace">IR</span>
        </div>
      </header>
      <aside className="sticky top-9 flex h-[calc(100dvh-36px)] flex-col border-r border-[#d5dbdb] bg-white pb-3.5 [grid-area:sidebar] max-[760px]:static max-[760px]:grid max-[760px]:h-auto max-[760px]:grid-cols-[1fr_auto] max-[760px]:border-b max-[760px]:pb-0">
        <NavLink to="/iotroot/dashboard" className="flex min-h-[54px] items-center gap-[5px] border-b border-[#eaeded] px-5 text-base font-semibold text-[#16191f] no-underline">
          IoTRoot <span className="text-[11px] font-bold text-[#8390fa]">IoT</span>
        </NavLink>
        <nav className="flex flex-col max-[760px]:col-span-full max-[760px]:row-start-2 max-[760px]:flex-row max-[760px]:p-2" aria-label="Main navigation">
          <NavLink to="/iotroot/dashboard" end className={navClass}>
            <Icon />
            Overview
          </NavLink>
          <NavLink to="/iotroot/dashboard/devices" className={navClass}>
            <Icon devices />
            Devices
          </NavLink>
          <NavLink to="/iotroot/dashboard/settings" className={navClass}>
            <Icon settings />
            Settings
          </NavLink>
        </nav>
        
      </aside>

      {/* Main Content */}
      <section className="min-w-0 [grid-area:main]">
        <section
          className="min-h-full w-full"
          id="workspace-content"
          tabIndex={-1}
        >
          <Outlet />
        </section>
      </section>
    </main>
  );
}
