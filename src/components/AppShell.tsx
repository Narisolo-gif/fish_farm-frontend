"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { modules } from "@/lib/data";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return children;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-mark">F</span>
          <span>
            Fish Farm <em>Anosy</em>
          </span>
        </Link>
        <nav className="topnav" aria-label="Navigation principale">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/production">Production</Link>
          <Link href="/admin/stock">Stock</Link>
          <Link href="/admin/orders">Commandes</Link>
        </nav>
        <div className="top-actions">
          <span className="notification">♧</span>
          <Link href="/admin">Admin</Link>
        </div>
      </header>
      <div className="workspace">
        <aside className="sidebar">
          <div className="sidebar-label">Modules</div>
          {modules.map((module) => (
            <Link
              key={module.key}
              href={`/production/${module.key}`}
              className="module-link"
            >
              <span>{module.icon}</span>
              {module.label}
            </Link>
          ))}
        </aside>
        <main className="main-content">{children}</main>
      </div>
      <footer className="footer">
        <span>Fish Farm Anosy</span>
        <span>© 2025 · Prototype frontend</span>
      </footer>
    </div>
  );
}
