"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LotActions } from "@/app/features/production/lots/components/LotActions";
import { StatCard } from "@/components/ui";
import { getLot, getLotEffectif } from "@/app/features/production/lots/services/lotApi";
import {
	type LotEffectif,
	LOT_ESPECE_LABELS,
	LOT_PARCOURS_LABELS,
	getLotSteps,
	getStadeBadgeClass,
	getStadeLabel,
	type LotRecord,
} from "@/app/features/production/lots/types/lot.types";

function formatDateTime(value: string) {
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? value
		: date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

function formatNumber(value: number) {
	return value.toLocaleString("fr-FR");
}

function formatPercent(value: number, total: number) {
	if (total <= 0) return "—";
	return `${((value / total) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}

function formatPart(value: number, total: number) {
	return total > 0 ? `${formatPercent(value, total)} de la quantité initiale` : undefined;
}

export function LotDetails({ lotId }: { lotId: string }) {
	const router = useRouter();
	const [lot, setLot] = useState<LotRecord | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");
	const [actionError, setActionError] = useState("");
	const [actionSuccess, setActionSuccess] = useState("");

	const [effectif, setEffectif] = useState<LotEffectif | null>(null);
	const [effectifError, setEffectifError] = useState("");

	useEffect(() => {
		let isActive = true;

		async function load() {
			try {
				const loaded = await getLot(lotId);
				if (!isActive) return;
				setLot(loaded);
				getLotEffectif(loaded)
					.then((result) => {
						if (isActive) setEffectif(result);
					})
					.catch((effectifLoadError: unknown) => {
						if (isActive) {
							setEffectifError(
								effectifLoadError instanceof Error
									? effectifLoadError.message
									: "Impossible de calculer l'effectif du lot.",
							);
						}
					});
			} catch (loadError) {
				if (isActive) {
					setError(loadError instanceof Error ? loadError.message : "Impossible de charger ce lot.");
				}
			} finally {
				if (isActive) setIsLoading(false);
			}
		}

		void load();
		return () => {
			isActive = false;
		};
	}, [lotId]);

	if (isLoading) {
		return <div className="page"><p className="list-empty-state" role="status">Chargement du lot…</p></div>;
	}

	if (error || !lot) {
		return (
			<div className="page">
				<Link className="lot-back-link" href="/production/lots">← Lots</Link>
				<p className="form-error" role="alert">{error || "Lot introuvable."}</p>
			</div>
		);
	}

	const steps = getLotSteps(lot.parcours_production);
	const currentIndex = steps.indexOf(lot.stade);

	return (
		<div className="page">
			<header className="lot-detail-header">
				<div className="lot-detail-title">
					<Link className="lot-back-link" href="/production/lots">← Lots</Link>
					<h1>{lot.reference}</h1>
					<span className={`${getStadeBadgeClass(lot.stade)} lot-status`}>{getStadeLabel(lot.stade)}</span>
				</div>
				<LotActions
					lot={lot}
					onClosed={(closed) => {
						setLot(closed);
						setActionError("");
						setActionSuccess("Lot clôturé avec succès.");
					}}
					onDeleted={() => router.push("/production/lots")}
					onError={(message) => {
						setActionSuccess("");
						setActionError(message);
					}}
				/>
			</header>

			{actionError && <p className="form-error" role="alert">{actionError}</p>}
			{actionSuccess && <p className="form-success" role="status">{actionSuccess}</p>}

			<section className="lot-stepper-section" aria-label="Suivi du stade du lot">
				<h2 className="lot-section-title">Suivi du stade</h2>
				<ol className="lot-stepper">
					{steps.map((step, index) => {
						const state = index < currentIndex ? "is-done" : index === currentIndex ? "is-current" : "is-todo";
						return (
							<li key={step} className={`lot-step ${state}`} aria-current={state === "is-current" ? "step" : undefined}>
								<span className="lot-step-marker">{index < currentIndex ? "✓" : index + 1}</span>
								<span className="lot-step-label">{getStadeLabel(step)}</span>
							</li>
						);
					})}
				</ol>
				<p className="helper-text">
					Parcours : {LOT_PARCOURS_LABELS[lot.parcours_production] ?? lot.parcours_production}
					{lot.parcours_production === "SANS_TRAITEMENT" && " — le lot passe directement en stock."}
				</p>
			</section>

			<section aria-label="Effectif du lot">
				<h2 className="lot-section-title">Effectif</h2>
				{effectifError ? (
					<p className="form-error" role="alert">{effectifError}</p>
				) : (
					<>
						<div className="stats-grid">
							<StatCard
								label="Effectif vivant actuel"
								value={effectif ? formatNumber(effectif.vivant) : "…"}
								detail={`sur ${formatNumber(lot.quantite_initiale)} au départ`}
							/>
							<StatCard
								label="Mortalité totale"
								value={effectif ? formatNumber(effectif.mortalite) : "…"}
								detail={effectif ? formatPart(effectif.mortalite, lot.quantite_initiale) : undefined}
							/>
							<StatCard
								label="Perte totale"
								value={effectif ? formatNumber(effectif.perte) : "…"}
								detail={effectif ? formatPart(effectif.perte, lot.quantite_initiale) : undefined}
							/>
							<StatCard
								label="Taux de survie"
								value={effectif ? formatPercent(effectif.vivant, lot.quantite_initiale) : "…"}
								detail="effectif vivant / quantité initiale"
							/>
						</div>
						{effectif && (
							<p className="helper-text lot-effectif-note">
								{effectif.aDesMouvements
									? "Calculé à partir du registre des effectifs du lot (entrées, sorties, mortalités, pertes, ventes et annulations). Une mortalité ou une perte saisie sans hapa, ou dans un hapa partagé par plusieurs lots, n'est pas rattachée au lot."
									: "Aucun mouvement enregistré pour ce lot : l'effectif correspond à la quantité initiale tant que le lot n'est pas placé en traitement ou en stock."}
							</p>
						)}
					</>
				)}
			</section>

			<section className="lot-overview" aria-label="Informations du lot">
				<article className="lot-info-panel">
					<h2>Éclosion d&apos;origine</h2>
					<p>
						<Link href="/production/ecloserie">{lot.reference_eclosion}</Link>
					</p>
				</article>
				<article className="lot-info-panel">
					<h2>Espèce</h2>
					<p>{LOT_ESPECE_LABELS[lot.espece] ?? lot.espece}</p>
				</article>
				<article className="lot-info-panel">
					<h2>Quantité initiale</h2>
					<p>{lot.quantite_initiale.toLocaleString("fr-FR")} alevins</p>
				</article>
				<article className="lot-info-panel">
					<h2>Date de création</h2>
					<p>{formatDateTime(lot.date_creation)}</p>
				</article>
				<article className="lot-info-panel">
					<h2>Observations</h2>
					<p>{lot.observations || "—"}</p>
				</article>
				<article className="lot-info-panel">
					<h2>Enregistrement</h2>
					<p>Créé le {formatDateTime(lot.created_at)}<br />Modifié le {formatDateTime(lot.updated_at)}</p>
				</article>
			</section>
		</div>
	);
}
