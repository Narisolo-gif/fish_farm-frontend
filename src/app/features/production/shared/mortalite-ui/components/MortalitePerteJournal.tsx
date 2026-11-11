"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ActionIcon } from "@/components/ActionIcon";
import { DataTable } from "@/components/DataTable";
import { ListSearch } from "@/components/ListSearch";
import { Pagination } from "@/components/Pagination";
import { StatCard } from "@/components/ui";
import { usePagination } from "@/app/hooks/usePagination";
import { matchesSearch } from "@/lib/search";
import { AnnulationDialog } from "@/app/features/production/shared/mortalite-ui/components/AnnulationDialog";
import { MortalitePerteForm } from "@/app/features/production/shared/mortalite-ui/components/MortalitePerteForm";
import {
	annulerEvenement,
	getCategories,
	getCauses,
	getEvenements,
	getMouvements,
} from "@/app/features/production/shared/mortalite-ui/services/mortaliteApi";
import {
	TYPE_EVENEMENT_LABELS,
	especeLabel,
	getHapaMode,
	sommeEffectif,
	type EvenementMortalitePerte,
	type JournalHapa,
	type MouvementEffectif,
	type Referentiel,
	type TypeEvenement,
} from "@/app/features/production/shared/mortalite-ui/types/mortalite.types";

const rowsPerPage = 10;

type StatutFilter = "TOUS" | "VALIDE" | "ANNULEE";

export type MortalitePerteJournalProps = {
	bassinId: number | null;
	bassinCategorie: string | null;
	/** Hapas proposés à la saisie (ceux de l'opération, ou tous les hapas actifs du bassin). */
	hapas?: JournalHapa[];
	/** Limite le journal et l'effectif aux hapas fournis (ex. : hapas d'un traitement). */
	restrictToHapas?: boolean;
	/** Limite le journal à une espèce (ex. : espèce du lot). */
	espece?: string | null;
	/** Date de début de l'opération (YYYY-MM-DD) : les événements antérieurs sont ignorés. */
	dateMin?: string | null;
	readOnly?: boolean;
	readOnlyReason?: string;
	title?: string;
};

function formatDateTime(value: string) {
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? value
		: date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

export function MortalitePerteJournal({
	bassinId,
	bassinCategorie,
	hapas = [],
	restrictToHapas = false,
	espece = null,
	dateMin = null,
	readOnly = false,
	readOnlyReason = "",
	title = "Journal mortalité / perte",
}: MortalitePerteJournalProps) {
	const [evenements, setEvenements] = useState<EvenementMortalitePerte[]>([]);
	const [mouvements, setMouvements] = useState<MouvementEffectif[]>([]);
	const [causes, setCauses] = useState<Referentiel[]>([]);
	const [categories, setCategories] = useState<Referentiel[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState("");
	const [message, setMessage] = useState("");

	const [isFormOpen, setIsFormOpen] = useState(false);
	const [correction, setCorrection] = useState<EvenementMortalitePerte | null>(null);
	const [annulation, setAnnulation] = useState<EvenementMortalitePerte | null>(null);

	const [search, setSearch] = useState("");
	const [statutFilter, setStatutFilter] = useState<StatutFilter>("TOUS");

	const hapaMode = getHapaMode(bassinCategorie);
	const scopeHapaIds = useMemo(() => new Set(hapas.map((hapa) => hapa.id)), [hapas]);

	const load = useCallback(async () => {
		if (bassinId === null) return;
		try {
			const [loadedEvenements, loadedMouvements, loadedCauses, loadedCategories] = await Promise.all([
				getEvenements({ bassin: bassinId, date_min: dateMin ?? undefined }),
				getMouvements({ bassin: bassinId }),
				getCauses(),
				getCategories(),
			]);
			setEvenements(loadedEvenements);
			setMouvements(loadedMouvements);
			setCauses(loadedCauses);
			setCategories(loadedCategories);
			setLoadError("");
		} catch (error) {
			setLoadError(error instanceof Error ? error.message : "Impossible de charger le journal.");
		} finally {
			setIsLoading(false);
		}
	}, [bassinId, dateMin]);

	// Le parent change la `key` du journal quand le périmètre change : l'état repart alors de zéro.
	useEffect(() => {
		void Promise.resolve().then(load);
	}, [load]);

	const inScope = useCallback(
		(item: { hapa_id: number | null; espece: string }) =>
			(!restrictToHapas || (item.hapa_id !== null && scopeHapaIds.has(item.hapa_id))) &&
			(!espece || item.espece === espece),
		[restrictToHapas, scopeHapaIds, espece],
	);

	const scopedEvenements = useMemo(
		() => evenements.filter((evenement) => inScope({ hapa_id: evenement.id_hapa, espece: evenement.espece })),
		[evenements, inScope],
	);
	const scopedMouvements = useMemo(
		() => mouvements.filter((mouvement) => inScope({ hapa_id: mouvement.hapa, espece: mouvement.espece })),
		[mouvements, inScope],
	);

	const effectifVivant = sommeEffectif(scopedMouvements);
	const totalPour = (type: TypeEvenement) =>
		scopedEvenements
			.filter((evenement) => evenement.type_evenement === type && evenement.statut === "VALIDE")
			.reduce((total, evenement) => total + evenement.quantite, 0);

	const especes = useMemo(() => {
		if (espece) return [espece];
		const totals = new Map<string, number>();
		for (const mouvement of scopedMouvements) {
			totals.set(mouvement.espece, (totals.get(mouvement.espece) ?? 0) + mouvement.sens * mouvement.quantite);
		}
		return [...totals].filter(([, total]) => total > 0).map(([item]) => item);
	}, [espece, scopedMouvements]);

	const effectifDisponible = useCallback(
		(hapaId: number | null, especeChoisie: string | null) =>
			sommeEffectif(
				mouvements.filter(
					(mouvement) =>
						(hapaId === null || mouvement.hapa === hapaId) &&
						(!especeChoisie || mouvement.espece === especeChoisie),
				),
			),
		[mouvements],
	);

	const filteredEvenements = scopedEvenements.filter(
		(evenement) =>
			(statutFilter === "TOUS" || evenement.statut === statutFilter) &&
			matchesSearch(
				[
					TYPE_EVENEMENT_LABELS[evenement.type_evenement as TypeEvenement],
					evenement.nom_hapa,
					especeLabel(evenement.espece),
					evenement.quantite,
					evenement.libelle_cause,
					evenement.libelle_categorie,
					evenement.justification,
					evenement.observation,
					evenement.motif_annulation,
					formatDateTime(evenement.date_evenement),
				],
				search,
			),
	);
	const { items: visible, currentPage, totalPages, goToPage, startItem, endItem } = usePagination(
		filteredEvenements,
		rowsPerPage,
	);

	function openForm(evenement: EvenementMortalitePerte | null) {
		setMessage("");
		setCorrection(evenement);
		setIsFormOpen(true);
	}

	function closeForm() {
		setIsFormOpen(false);
		setCorrection(null);
	}

	if (bassinId === null) {
		return <p className="list-empty-state">Aucun bassin associé : le journal n&apos;est pas disponible.</p>;
	}

	const showHapa = hapaMode !== "forbidden" && (hapas.length > 0 || scopedEvenements.some((item) => item.nom_hapa));
	const showEspece = !espece && new Set(scopedEvenements.map((item) => item.espece)).size > 1;
	const headers = [
		"Date",
		"Type",
		...(showHapa ? ["Hapa"] : []),
		...(showEspece ? ["Espèce"] : []),
		"Quantité",
		"Cause / catégorie",
		"Justification / observation",
		"Statut",
		"Actions",
	];

	return (
		<section className="treatment-mortality mortality-journal" aria-label={title}>
			<div className="stats-grid three">
				<StatCard
					label="Effectif vivant actuel"
					value={isLoading ? "…" : effectifVivant.toLocaleString("fr-FR")}
					detail={restrictToHapas ? "hapas de l'opération" : "bassin"}
				/>
				<StatCard label="Mortalité totale" value={isLoading ? "…" : totalPour("MORTALITE").toLocaleString("fr-FR")} />
				<StatCard label="Pertes totales" value={isLoading ? "…" : totalPour("PERTE").toLocaleString("fr-FR")} />
			</div>

			<div className="treatment-mortality-heading">
				<h2>{title}</h2>
				{!readOnly && !isFormOpen && (
					<button className="button button-primary" type="button" onClick={() => openForm(null)} disabled={isLoading}>
						+ Mortalité / perte
					</button>
				)}
			</div>

			{readOnly && readOnlyReason && <p className="helper-text">{readOnlyReason}</p>}
			{message && <p className="form-success" role="status">{message}</p>}

			{isFormOpen && (
				<MortalitePerteForm
					key={correction?.id ?? "new"}
					bassinId={bassinId}
					hapaMode={hapaMode}
					hapas={hapas}
					especes={especes}
					effectifDisponible={effectifDisponible}
					causes={causes}
					categories={categories}
					correction={correction}
					onCancel={closeForm}
					onSaved={(savedMessage) => {
						closeForm();
						setMessage(savedMessage);
						void load();
					}}
				/>
			)}

			{loadError ? (
				<p className="form-error" role="alert">{loadError}</p>
			) : isLoading ? (
				<p className="list-empty-state" role="status">Chargement du journal…</p>
			) : (
				<div className="list-content">
					<div className="list-toolbar">
						<ListSearch
							value={search}
							onChange={(value) => {
								setSearch(value);
								goToPage(1);
							}}
							placeholder="Type, hapa, cause, justification..."
							label="Rechercher dans le journal mortalité / perte"
						/>
						<label className="journal-filter">
							<span>Statut</span>
							<select
								value={statutFilter}
								onChange={(event) => {
									setStatutFilter(event.target.value as StatutFilter);
									goToPage(1);
								}}
							>
								<option value="TOUS">Tous</option>
								<option value="VALIDE">Validés</option>
								<option value="ANNULEE">Annulés</option>
							</select>
						</label>
						<span className="list-result-count" aria-live="polite">
							{filteredEvenements.length} événement{filteredEvenements.length > 1 ? "s" : ""}
						</span>
					</div>
					{visible.length > 0 ? (
						<DataTable
							className="treatment-journal-table table-with-actions journal-table"
							headers={headers}
							rows={visible.map((evenement) => {
								const isValide = evenement.statut === "VALIDE";
								return [
									formatDateTime(evenement.date_evenement),
									<span
										key={`${evenement.id}-type`}
										className={`badge ${evenement.type_evenement === "MORTALITE" ? "badge-amber" : "badge-blue"}`}
									>
										{TYPE_EVENEMENT_LABELS[evenement.type_evenement as TypeEvenement] ?? evenement.type_evenement}
									</span>,
									...(showHapa ? [evenement.nom_hapa ?? "Bassin entier"] : []),
									...(showEspece ? [especeLabel(evenement.espece)] : []),
									evenement.quantite.toLocaleString("fr-FR"),
									evenement.libelle_cause ?? evenement.libelle_categorie ?? "—",
									[evenement.justification, evenement.observation].filter(Boolean).join(" · ") || "—",
									isValide ? (
										<span key={`${evenement.id}-statut`} className="badge badge-green">Validé</span>
									) : (
										<span
											key={`${evenement.id}-statut`}
											className="badge"
											title={evenement.motif_annulation ? `Motif : ${evenement.motif_annulation}` : undefined}
										>
											Annulé
										</span>
									),
									isValide && !readOnly ? (
										<div key={`${evenement.id}-actions`} className="lot-actions">
											<button
												type="button"
												className="button button-ghost icon-button"
												onClick={() => openForm(evenement)}
												aria-label={`Corriger l'événement du ${formatDateTime(evenement.date_evenement)}`}
												title="Corriger"
											>
												<ActionIcon name="edit" />
											</button>
											<button
												type="button"
												className="button button-danger icon-button"
												onClick={() => {
													setMessage("");
													setAnnulation(evenement);
												}}
												aria-label={`Annuler l'événement du ${formatDateTime(evenement.date_evenement)}`}
												title="Annuler"
											>
												<ActionIcon name="cancel" />
											</button>
										</div>
									) : (
										"—"
									),
								];
							})}
						/>
					) : (
						<p className="list-empty-state">
							{scopedEvenements.length === 0
								? "Aucune mortalité ni perte enregistrée."
								: "Aucun événement ne correspond aux filtres."}
						</p>
					)}
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						totalItems={filteredEvenements.length}
						startItem={startItem}
						endItem={endItem}
						onPageChange={goToPage}
					/>
				</div>
			)}

			{annulation && (
				<AnnulationDialog
					title="Annuler l'événement"
					description={`${TYPE_EVENEMENT_LABELS[annulation.type_evenement as TypeEvenement]} de ${annulation.quantite.toLocaleString("fr-FR")} du ${formatDateTime(annulation.date_evenement)}. Un mouvement d'annulation sera inscrit au registre des effectifs.`}
					onClose={() => setAnnulation(null)}
					onConfirm={async (motif) => {
						await annulerEvenement(annulation.id, motif);
						setAnnulation(null);
						setMessage("Événement annulé.");
						await load();
					}}
				/>
			)}
		</section>
	);
}
