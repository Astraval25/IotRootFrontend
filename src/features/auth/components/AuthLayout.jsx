import { Link } from 'react-router-dom'

export function AuthLayout({ title, subtitle, children, footerLinks = [] }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f2f3f3] p-5 text-[#1d2f6f]">
      <section className="grid w-full max-w-[980px] grid-cols-[1.15fr_1fr] gap-5 max-[760px]:grid-cols-1">
        <aside className="flex flex-col justify-center rounded-lg border border-[#d5dbdb] bg-[#1d2f6f] p-9 text-white shadow-sm">
          <p className="m-0 text-xs font-bold uppercase tracking-[.14em] text-[#fac748]">IoTRoot Cloud</p>
          <h1 className="my-5 whitespace-pre-line text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-tight">Your devices.
            One workspace.</h1>
          <p className="m-0 text-[#dce0ff]">Connect, manage, and monitor.</p>
        </aside>

        <section className="rounded-lg border border-[#d5dbdb] bg-white p-9 shadow-sm">
          <h2 className="m-0 text-2xl font-semibold tracking-tight text-[#1d2f6f]">{title}</h2>
          <p className="mb-6 mt-2 text-sm text-slate-500">{subtitle}</p>
          {children}

          {footerLinks.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-200 pt-5 text-sm [&_a]:font-semibold [&_a]:text-[#1d2f6f]">
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
