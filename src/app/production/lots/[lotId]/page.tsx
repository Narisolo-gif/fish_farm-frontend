import Link from "next/link";

const futureTabs = ["Traitements", "Stockage", "Grossissement", "Vente"];
type LotStatus = "Fraîchement éclos" | "En traitement" | "En stocks" | "Clôturé";

const currentStatus: LotStatus = "Fraîchement éclos";
const statusBadgeClass: Record<LotStatus, string> = {
	"Fraîchement éclos": "badge-green",
	"En traitement": "badge-amber",
	"En stocks": "badge-blue",
	"Clôturé": "badge",
};

export default async function LotDetailsPage({
	params,
}: {
	params: Promise<{ lotId: string }>;
}) {
	const { lotId } = await params;

	return (
		<div className="page">
			<header className="lot-detail-header">
				<div className="lot-detail-title">
					<Link className="lot-back-link" href="/production/lots">Lots</Link>
					<h1>Lot #{lotId}</h1>
				</div>
				<span className={`badge ${statusBadgeClass[currentStatus]} lot-status`}>{currentStatus}</span>
			</header>

			<nav className="lot-tabs" aria-label="Historique du lot">
				<Link className="lot-tab is-active" href={`/production/lots/${lotId}`} aria-current="page">
					Historique
				</Link>
				{futureTabs.map((tab) => (
					<button className="lot-tab" key={tab} type="button" disabled>
						{tab}
					</button>
				))}
			</nav>

			<section className="lot-overview" aria-label="Informations du lot">
				<article className="lot-info-panel">
					<h2>Éclosion d'origine</h2>
					<p>Informations d'éclosion non renseignées.</p>
				</article>
				<article className="lot-info-panel">
					<h2>Statut actuel</h2>
					<p><span className={`badge ${statusBadgeClass[currentStatus]}`}>{currentStatus}</span></p>
				</article>
			</section>

			<section className="lot-history" aria-label="Historique du lot">
				<div className="table-wrap">
					<table>
						<thead>
							<tr>
								<th>Date</th>
								<th>Quantité</th>
								<th>Observation</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td className="lot-history-empty" colSpan={3}>Aucun événement dans l'historique pour le moment.</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>
		</div>
	);
}
