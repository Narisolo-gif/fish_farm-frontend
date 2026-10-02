import Link from "next/link";

const actions = [
  { label: "Historique", href: "/production/grossissement/historique" },
//   { label: "Configuration bassin" },
  { label: "Suivi", href: "/production/grossissement/suivi" },
  { label: "Clôturer" },
];

export function GrossissementHome() {
  return (
    <div className="page grossissement-home">
      <section className="production-hero">
        <div className="production-hero-content">
          <p className="eyebrow">FISH FARM ANOSY · PRODUCTION</p>
          <h1>Faites grandir vos lots, bassin après bassin.</h1>
          <p>
            Retrouvez les étapes essentielles pour organiser et suivre vos
            cycles de grossissement.
          </p>
        </div>
      </section>

      <nav className="ecloserie-actions grossissement-actions" aria-label="Grossissement">
        {actions.map(({ label, href }) =>
          href ? (
            <Link className="button button-ghost grossissement-action" href={href} key={label}>
              <span>{label}</span>
              <span aria-hidden="true" className="grossissement-action-arrow">→</span>
            </Link>
          ) : (
            <button
              className="button button-ghost grossissement-action"
              disabled
              key={label}
              title="Cette rubrique sera disponible prochainement."
              type="button"
            >
              <span>{label}</span>
              <span aria-hidden="true" className="grossissement-action-arrow">→</span>
            </button>
          ),
        )}
      </nav>
    </div>
  );
}