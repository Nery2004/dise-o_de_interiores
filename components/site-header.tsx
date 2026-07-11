import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/editor", label: "Editor" },
  { href: "/projects", label: "Mis proyectos" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#e2dbcf]/80 bg-[#fbfaf7]/88 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#1f2421] text-sm font-semibold text-[#fbfaf7]">
            IC
          </span>
          <span className="truncate text-sm font-semibold tracking-[0.08em] text-[#202621]">
            Interior Color Studio
          </span>
        </Link>

        <nav className="flex items-center gap-1 rounded-full border border-[#ded6c9] bg-white/55 p-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-[#5f675f] transition hover:bg-[#eef1e8] hover:text-[#242a25]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
