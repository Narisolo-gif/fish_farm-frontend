"use client";

import { SectionHeading, StatCard } from "@/components/ui";
import { DiscussionWidget } from "@/app/features/production/shared/dashboard-ui/components/DiscussionWidget";

export function GrossissementDashboard() {
  return (
    <section className="grossissement-dashboard" aria-label="Dashboard du grossissement">
      <div className="grossissement-dashboard-overview">
        <div className="stats-grid grossissement-dashboard-stats">
          <StatCard label="GMQ moyen" value="— g/j" detail="Gain moyen quotidien" />
          <StatCard label="Biomasse" value="— kg" detail="— individus" />
          <StatCard label="ICA" value="—" detail="Indice de conversion alimentaire" />
        </div>
        <button
          className="button button-ghost"
          type="button"
          disabled
          title="L'export sera disponible avec les données du grossissement."
        >
          ↓ Exporter les données
        </button>
      </div>

      <div className="grossissement-dashboard-chart-grid">
        <section className="panel grossissement-chart-panel">
          <SectionHeading title="GMQ" />
          <svg className="grossissement-chart" viewBox="0 0 320 142" role="img" aria-label="Courbe statique du GMQ">
            <g className="grossissement-chart-gridlines">
              <line x1="28" x2="308" y1="25" y2="25" />
              <line x1="28" x2="308" y1="66" y2="66" />
              <line x1="28" x2="308" y1="107" y2="107" />
            </g>
            <polyline className="grossissement-chart-line" points="30,102 76,83 122,88 168,60 214,67 260,42 306,34" />
            <text x="28" y="130">Début</text>
            <text x="267" y="130">Aujourd'hui</text>
          </svg>
        </section>

        <section className="panel grossissement-chart-panel">
          <SectionHeading title="Biomasse par étape" />
          <svg className="grossissement-chart" viewBox="0 0 320 142" role="img" aria-label="Histogramme statique de biomasse">
            <g className="grossissement-chart-gridlines">
              <line x1="22" x2="308" y1="107" y2="107" />
              <line x1="22" x2="308" y1="66" y2="66" />
              <line x1="22" x2="308" y1="25" y2="25" />
            </g>
            <rect className="grossissement-chart-bar" x="48" y="72" width="34" height="35" />
            <rect className="grossissement-chart-bar is-secondary" x="112" y="55" width="34" height="52" />
            <rect className="grossissement-chart-bar" x="176" y="39" width="34" height="68" />
            <rect className="grossissement-chart-bar is-secondary" x="240" y="28" width="34" height="79" />
            <text x="47" y="130">Étape 1</text>
            <text x="237" y="130">Étape 4</text>
          </svg>
        </section>

        <section className="panel grossissement-chart-panel">
          <SectionHeading title="ICA" />
          <svg className="grossissement-chart" viewBox="0 0 320 142" role="img" aria-label="Courbe statique de l'ICA">
            <g className="grossissement-chart-gridlines">
              <line x1="28" x2="308" y1="25" y2="25" />
              <line x1="28" x2="308" y1="66" y2="66" />
              <line x1="28" x2="308" y1="107" y2="107" />
            </g>
            <polyline className="grossissement-chart-line is-secondary" points="30,100 76,86 122,77 168,74 214,56 260,45 306,30" />
            <text x="28" y="130">Début</text>
            <text x="267" y="130">Aujourd'hui</text>
          </svg>
        </section>
      </div>

      <div className="grossissement-dashboard-distribution">
        <section className="panel grossissement-chart-panel">
          <SectionHeading title="Distribution des poids" />
          <svg className="grossissement-distribution-chart" viewBox="0 0 720 190" role="img" aria-label="Courbe statique de distribution des poids">
            <g className="grossissement-chart-gridlines">
              <line x1="24" x2="696" y1="150" y2="150" />
              <line x1="24" x2="696" y1="105" y2="105" />
              <line x1="24" x2="696" y1="60" y2="60" />
            </g>
            <path className="grossissement-distribution-line" d="M 30 148 C 180 148, 190 30, 358 28 C 526 30, 540 148, 690 148" />
            <text x="25" y="178">Poids faible</text>
            <text x="620" y="178">Poids élevé</text>
          </svg>
        </section>

        <section className="panel grossissement-chart-panel">
          <SectionHeading title="Sexage" />
          <div className="grossissement-sexage">
            <svg viewBox="0 0 140 140" role="img" aria-label="Répartition du sexage non renseignée">
              <circle className="grossissement-sexage-ring" cx="70" cy="70" r="48" />
              <text x="70" y="74" textAnchor="middle">—</text>
            </svg>
            <ul className="grossissement-sexage-legend">
              <li><span className="grossissement-legend-swatch" /> Mâle : —%</li>
              <li><span className="grossissement-legend-swatch is-secondary" /> Femelle : —%</li>
            </ul>
          </div>
        </section>
      </div>

      <p className="grossissement-dashboard-note">Courbes schématiques ; les mesures réelles ne sont pas encore renseignées.</p>

      <DiscussionWidget
        title="Discussion sur les poids moyens"
        description="Posez vos questions sur une anomalie de poids ou l'évolution du lot."
        placeholder="Écrire un message..."
      />
    </section>
  );
}