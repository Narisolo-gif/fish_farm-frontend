"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { apiRequest } from "@/lib/apiClient";
import { BassinMouvementsSection } from "@/app/features/production/shared/mortalite-ui/components/BassinMouvementsSection";
import { MortalitePerteJournal } from "@/app/features/production/shared/mortalite-ui/components/MortalitePerteJournal";

type BassinRecord = {
	id: number;
	reference: string;
	categorie: string;
	capacity: number | null;
	statut: string;
	hapas: { id: number; nom: string; actif: boolean; statut: string }[];
};

const CATEGORIE_LABELS: Record<string, string> = {
	REPRODUCTION: "Reproduction",
	ECLOSERIE: "Écloserie",
	TRAITEMENT: "Traitement",
	STOCKS: "Stocks",
	GROSSISSEMENT: "Grossissement",
};

export function BassinDetail({ bassinId }: { bassinId: string }) {
	const [bassin, setBassin] = useState<BassinRecord | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");
	const [tab, setTab] = useState<"mouvements" | "mortalite">("mouvements");

	useEffect(() => {
		let isActive = true;
		Promise.resolve()
			.then(() => {
				const accessToken = localStorage.getItem("access_token");
				if (!accessToken) {
					throw new Error("Votre session a expiré. Veuillez vous reconnecter.");
				}
				return apiRequest<BassinRecord>(`/api/v1/bassins/${encodeURIComponent(bassinId)}/`, {
					headers: { Authorization: `Bearer ${accessToken}` },
				});
			})
			.then((loaded) => {
				if (isActive) setBassin(loaded);
			})
			.catch((loadError: unknown) => {
				if (isActive) setError(loadError instanceof Error ? loadError.message : "Impossible de charger le bassin.");
			})
			.finally(() => {
				if (isActive) setIsLoading(false);
			});
		return () => {
			isActive = false;
		};
	}, [bassinId]);

	if (isLoading) {
		return <div className="page"><p className="list-empty-state" role="status">Chargement du bassin…</p></div>;
	}
	if (error || !bassin) {
		return (
			<div className="page">
				<Link className="lot-back-link" href="/bassins">← Bassins</Link>
				<p className="form-error" role="alert">{error || "Bassin introuvable."}</p>
			</div>
		);
	}

	const hapasActifs = (bassin.hapas ?? [])
		.filter((hapa) => hapa.actif)
		.map((hapa) => ({ id: hapa.id, nom: hapa.nom }));
	const isInactive = bassin.statut !== "ACTIF";

	return (
		<div className="page">
			<Link className="lot-back-link" href="/bassins">← Bassins</Link>
			<PageHeader
				eyebrow={`Bassin · ${CATEGORIE_LABELS[bassin.categorie] ?? bassin.categorie}`}
				title={bassin.reference}
				description="Suivi des effectifs et des mouvements du bassin."
			/>
			<dl className="treatment-meta">
				<div>
					<dt>Catégorie</dt>
					<dd>{CATEGORIE_LABELS[bassin.categorie] ?? bassin.categorie}</dd>
				</div>
				<div>
					<dt>Statut</dt>
					<dd><span className={`badge ${isInactive ? "" : "badge-green"}`}>{isInactive ? "Inactif" : "Actif"}</span></dd>
				</div>
				<div>
					<dt>Hapas actifs</dt>
					<dd>{hapasActifs.length > 0 ? hapasActifs.map((hapa) => hapa.nom).join(", ") : "—"}</dd>
				</div>
			</dl>

			<nav className="lot-tabs" aria-label="Sections du bassin">
				<button
					type="button"
					className={`lot-tab${tab === "mouvements" ? " is-active" : ""}`}
					aria-current={tab === "mouvements" ? "page" : undefined}
					onClick={() => setTab("mouvements")}
				>
					Mouvements d&apos;effectifs
				</button>
				<button
					type="button"
					className={`lot-tab${tab === "mortalite" ? " is-active" : ""}`}
					aria-current={tab === "mortalite" ? "page" : undefined}
					onClick={() => setTab("mortalite")}
				>
					Mortalité / perte
				</button>
			</nav>

			{/* Chaque onglet est remonté à l'affichage : les chiffres restent à jour après une saisie. */}
			{tab === "mouvements" ? (
				<BassinMouvementsSection bassinId={bassin.id} hapas={hapasActifs} />
			) : (
				<MortalitePerteJournal
					bassinId={bassin.id}
					bassinCategorie={bassin.categorie}
					hapas={hapasActifs}
					readOnly={isInactive}
					readOnlyReason="Bassin inactif : aucune saisie n'est possible."
				/>
			)}
		</div>
	);
}
