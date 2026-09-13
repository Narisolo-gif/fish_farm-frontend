import Link from "next/link";
import { modules } from "@/lib/data";

export function AppShell({ children }: { children: React.ReactNode }) {
  return <div className="app-shell">
    <header className="topbar">
      <Link href="/" className="brand"><span className="brand-mark">F</span><span>Fish Farm <em>Anosy</em></span></Link>
      <nav className="topnav" aria-label="Navigation principale">
        <Link href="/dashboard">Dashboard</Link><Link href="/production">Production</Link><Link href="/stock">Stock</Link><Link href="/orders">Commandes</Link>
      </nav>
      <div className="top-actions"><span className="notification">♧</span><Link href="/users">Admin</Link></div>
    </header>
    <div className="workspace">
      <aside className="sidebar">
        <div className="sidebar-label">Modules</div>
        {modules.map((module) => <Link key={module.key} href={`/production/${module.key}`} className="module-link"><span>{module.icon}</span>{module.label}</Link>)}
        <div className="sidebar-divider" />
        <div className="sidebar-label">Administration</div>
        <Link href="/users" className="side-link">Utilisateurs</Link><Link href="/orders" className="side-link">Commandes</Link>
      </aside>
      <main className="main-content">{children}</main>
    </div>
    <footer className="footer"><span>Fish Farm Anosy</span><span>© 2025 · Prototype frontend</span></footer>
  </div>;
}
