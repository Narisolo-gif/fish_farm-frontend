import Link from "next/link";

export function Button({ children, href, variant = "primary" }: { children: React.ReactNode; href?: string; variant?: "primary" | "ghost" }) {
  const className = `button button-${variant}`;
  return href ? <Link className={className} href={href}>{children}</Link> : <button className={className}>{children}</button>;
}

export function StatCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <article className="stat-card"><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</article>;
}

export function SectionHeading({ title, action }: { title: string; action?: React.ReactNode }) {
  return <div className="section-heading"><h2>{title}</h2>{action}</div>;
}

export function EmptyChart({ children }: { children: React.ReactNode }) {
  return <div className="empty-chart"><span className="chart-line" />{children}</div>;
}
