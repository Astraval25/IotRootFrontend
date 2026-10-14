const items = [
  {
    id: 'service',
    label: 'Service',
    icon: <path d="M4 7h16M7 4v6m10-6v6M5 13h14v7H5zM9 16h2m2 0h2" />,
  },
  {
    id: 'account',
    label: 'Account',
    icon: <><circle cx="12" cy="8" r="3" /><path d="M5 20c.6-4 3-6 7-6s6.4 2 7 6" /></>,
  },
]

export function SettingsSideNavigation({ activeSection, onSectionChange }) {
  return (
    <aside className="h-screen border-r border-[#d5dbdb] bg-white max-[820px]:border-b max-[820px]:border-r-0" aria-label="Settings navigation">
      <div className="border-b border-[#eaeded] px-2 py-2">
        <h2 className="mt-1 text-xl font-semibold text-[#1d2f6f]">Settings</h2>
      </div>
      <nav className="grid gap-2 p-2 max-[820px]:grid-cols-2">
        {items.map(item => {
          const isActive = activeSection === item.id
          return (
            <button
              key={item.id}
              type="button"
              className={`flex w-full items-start gap-3 border-l-4 px-1 py-1 text-left transition-colors ${isActive ? 'border-[#8390fa] bg-[#eef0ff] text-[#1d2f6f]' : 'border-transparent bg-transparent text-slate-700 hover:bg-slate-50'}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSectionChange(item.id)}
            >
              <svg className="mt-0.5 size-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">{item.icon}</svg>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">{item.description}</span>
              </span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
