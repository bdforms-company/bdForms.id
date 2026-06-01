import Link from "next/link";

type NavPage = "product" | "pricing";

type MegaItem = { icon: string; title: string; desc: string };

const DOCS_MENU: { heading: string; items: MegaItem[] }[] = [
  {
    heading: "Documentation",
    items: [
      { icon: "rocket_launch", title: "Getting Started", desc: "Start building in minutes" },
      { icon: "how_to_reg", title: "Participant Registration", desc: "Digital sign-up flows" },
      { icon: "qr_code_scanner", title: "QR Check-In", desc: "Instant gate validation" },
    ],
  },
  {
    heading: "Modules",
    items: [
      { icon: "verified_user", title: "Anti-Fraud Verification", desc: "Secure attendee identity" },
      { icon: "monitoring", title: "Analytics & Reports", desc: "Real-time event insights" },
      { icon: "account_tree", title: "System Architecture", desc: "Offline-first infrastructure" },
    ],
  },
];

const SOLUTIONS_MENU: { heading: string; items: MegaItem[] }[] = [
  {
    heading: "Event Types",
    items: [
      { icon: "school", title: "Campus Event", desc: "University & student programs" },
      { icon: "groups", title: "Seminar and Workshop", desc: "Professional learning sessions" },
      { icon: "diversity_3", title: "Communities and Organizations", desc: "Clubs & NGO gatherings" },
    ],
  },
  {
    heading: "Use Cases",
    items: [
      { icon: "timer_off", title: "Reduce Registration Queue", desc: "Faster check-in at the gate" },
      { icon: "shield", title: "Prevent Attendance Fraud", desc: "Verified entry only" },
      { icon: "eco", title: "Paperless Registration", desc: "Fully digital workflows" },
    ],
  },
];

function MegaMenu({ columns }: { columns: typeof DOCS_MENU }) {
  return (
    <div className="nav-mega-panel">
      <div className="nav-mega-inner">
        {columns.map((col) => (
          <div key={col.heading} className="nav-mega-col">
            <p className="nav-mega-heading">{col.heading}</p>
            <ul className="nav-mega-list">
              {col.items.map((item) => (
                <li key={item.title}>
                  <button type="button" className="nav-mega-item">
                    <span className="nav-mega-icon">
                      <span className="material-symbols-outlined text-lg">{item.icon}</span>
                    </span>
                    <span className="nav-mega-text">
                      <span className="nav-mega-title">{item.title}</span>
                      <span className="nav-mega-desc">{item.desc}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function MegaTrigger({ label }: { label: string }) {
  return (
    <button type="button" className="nav-mega-trigger">
      {label}
      <span className="material-symbols-outlined text-base">expand_more</span>
    </button>
  );
}

export function SiteNav({ active = "product" }: { active?: NavPage }) {
  const linkClass = "text-sm font-medium hover:opacity-80";
  const muted = { color: "var(--on-surface-variant)" } as const;
  const activeStyle = { color: "var(--green)", borderColor: "var(--green)" } as const;

  return (
    <nav className="site-nav fixed top-0 z-50 w-full border-b border-white/5 bg-black/70 backdrop-blur-xl">
      <div className="flex h-20 items-center justify-between px-6 md:px-10">
        <Link href="/" className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[28px]" style={{ color: "var(--primary)" }}>
            layers
          </span>
          <span className="text-xl font-bold" style={{ color: "var(--primary)" }}>
            bdForms
          </span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {active === "product" ? (
            <span className="border-b-2 pb-1 text-sm font-bold" style={activeStyle}>
              Product
            </span>
          ) : (
            <Link href="/" className={linkClass} style={muted}>
              Product
            </Link>
          )}

          <div className="nav-mega-group">
            <MegaTrigger label="Docs" />
            <MegaMenu columns={DOCS_MENU} />
          </div>

          <div className="nav-mega-group">
            <MegaTrigger label="Solutions" />
            <MegaMenu columns={SOLUTIONS_MENU} />
          </div>

          {active === "pricing" ? (
            <span className="border-b-2 pb-1 text-sm font-bold" style={activeStyle}>
              Pricing
            </span>
          ) : (
            <Link href="/pricing" className={linkClass} style={muted}>
              Pricing
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <button
            type="button"
            disabled
            className="cursor-not-allowed text-sm opacity-45"
            style={{ color: "var(--on-surface-variant)" }}
            title="Coming soon"
          >
            Login
          </button>
          <Link
            href="/create"
            className="rounded-full px-5 py-2.5 text-sm font-bold neon-green sm:px-6"
            style={{ background: "var(--green)", color: "var(--on-green)" }}
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
