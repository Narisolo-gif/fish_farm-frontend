"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/apiClient";

type SidebarProps = {
  isAdmin: boolean;
  onLogout: () => void;
};

const adminNavigation = [
  { label: "Utilisateurs", href: "/admin/users", icon: "♙" },
  { label: "Provendes", href: "/admin/stock", icon: "▣" },
  { label: "Commandes", href: "/admin/orders", icon: "▤" },
  { label: "Tableau de bord", href: "/admin", icon: "⌂" },
  { label: "Alertes", href: "/admin/alerts", icon: "!" },
];

const productionNavigation = [
  { label: "Reproduction", href: "/production/reproduction", icon: "♡" },
  { label: "Écloserie", href: "/production/ecloserie", icon: "◯" },
  { label: "Lots", href: "/production/lots", icon: "▤" },
  { label: "Traitement", href: "/production/traitement", icon: "✣" },
  { label: "Stocks", href: "/production/stock", icon: "▣" },
  { label: "Grossissements", href: "/production/grossissement", icon: "↟" },
];

function Sidebar({ isAdmin, onLogout }: SidebarProps) {
  const navigation = isAdmin ? adminNavigation : productionNavigation;

  return (
    <aside className="sidebar" style={{ display: "flex", flexDirection: "column" }}>
      <div className="sidebar-label">{isAdmin ? "Admin" : "Production"}</div>
      <nav aria-label={`Navigation ${isAdmin ? "Admin" : "Production"}`}>
        {navigation.map((item) => (
          <Link key={item.href} href={item.href} className="module-link">
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <button
        type="button"
        className="side-link"
        onClick={onLogout}
        style={{ marginTop: "auto", width: "100%", border: 0, background: "transparent", textAlign: "left" }}
      >
        Déconnexion
      </button>
    </aside>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState("Utilisateur");

  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
      return;
    }

    apiRequest<{ username: string }>("/api/auth/me/", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((user) => setUsername(user.username))
      .catch(() => undefined);
  }, []);

  async function handleLogout() {
    const accessToken = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");

    try {
      if (accessToken && refreshToken) {
        await apiRequest("/api/auth/logout/", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            refresh: refreshToken,
          }),
        });
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      router.push("/login");
    }
  }

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
          <Link href="/admin/stock">Provenderies</Link>
        </nav>
        <label className="search-box">
          <span aria-hidden="true">⌕</span>
          <input type="search" placeholder="Rechercher" aria-label="Rechercher" />
        </label>
        <div className="top-actions">
          <span className="notification" aria-label="Notifications">♧</span>
          <details className="profile-menu">
            <summary>
              <span className="profile-avatar" aria-hidden="true">{username.charAt(0).toUpperCase()}</span>
              <span className="profile-name">{username}</span>
              <span aria-hidden="true">⌄</span>
            </summary>
            <div className="profile-dropdown">
              <strong>{username}</strong>
              <button type="button" onClick={handleLogout}>Déconnexion</button>
            </div>
          </details>
        </div>
      </header>
      <div className="workspace">
        <Sidebar isAdmin={pathname.startsWith("/admin")} onLogout={handleLogout} />
        <main className="main-content">{children}</main>
      </div>
      <footer className="footer">
        <span>Fish Farm Anosy</span>
        <span>© 2025 · Prototype frontend</span>
      </footer>
    </div>
  );
}
