"use client";

import { useCallback, useEffect, useState } from "react";
import { ActionIcon } from "@/components/ActionIcon";
import { DataTable } from "@/components/DataTable";
import { ListSearch } from "@/components/ListSearch";
import { Pagination } from "@/components/Pagination";
import { SectionHeading } from "@/components/ui";
import { usePagination } from "@/app/hooks/usePagination";
import { matchesSearch } from "@/lib/search";
import { AnnulationDialog } from "@/app/features/production/shared/mortalite-ui/components/AnnulationDialog";
import { SortieStockForm } from "@/app/features/production/stocks/components/SortieStockForm";
import { ValidationSortieDialog } from "@/app/features/production/stocks/components/ValidationSortieDialog";
import {
	annulerSortie,
	getBassinsDestination,
	getSortiesDuLot,
} from "@/app/features/production/stocks/services/sortieStockApi";
import {
	STATUT_SORTIE_LABELS,
	TYPE_SORTIE_LABELS,
	type BassinDestination,
	type SortieStock,
	type StatutSortieStock,
} from "@/app/features/production/stocks/types/sortieStock.types";

const rowsPerPage = 5;

type StatutFilter = "TOUS" | StatutSortieStock;

const STATUT_BADGES: Record<StatutSortieStock, string> = {
	BROUILLON: "badge badge-blue",
	VALIDEE: "badge badge-green",
	ANNULEE: "badge badge-amber",
};

function formatDateTime(value: string | null) {
	if (!value) return "—";
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? value
		: date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

function formatEffectif(value: number | null) {
	return value === null ? "—" : value.toLocaleString("fr-FR");
}

export function StockExitHistorySection({
	lotId,
	dateMiseEnStock,
	finalite,
	lotStade,
	isClosed,
	onLotChanged,
}: {
	lotId: number;
	dateMiseEnStock: string;
	finalite: string | null;
	lotStade: string | null;
	isClosed: boolean;
	/** Appelé après une validation ou une annulation : le stade du lot a pu changer. */
	onLotChanged: () => void;
}) {
	const [sorties, setSorties] = useState<SortieStock[]>([]);
	const [bassins, setBassins] = useState<BassinDestination[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState("");
	const [message, setMessage] = useState("");

	const [isFormOpen, setIsFormOpen] = useState(false);
	const [edition, setEdition] = useState<SortieStock | null>(null);
	const [validation, setValidation] = useState<SortieStock | null>(null);
	const [annulation, setAnnulation] = useState<SortieStock | null>(null);

	const [search, setSearch] = useState("");
	const [statutFilter, setStatutFilter] = useState<StatutFilter>("TOUS");

	const load = useCallback(async () => {
		try {
			const [loadedSorties, loadedBassins] = await Promise.all([getSortiesDuLot(lotId), getBassinsDestination()]);
			setSorties(loadedSorties);
			setBassins(loadedBassins);
			setLoadError("");
		} catch (error) {
			setLoadError(error instanceof Error ? error.message : "Impossible de charger l'historique de sortie.");
		} finally {
			setIsLoading(false);
		}
	}, [lotId]);

	useEffect(() => {
		void Promise.resolve().then(load);
	}, [load]);

	// Contrainte backend : une seule sortie active (brouillon ou validée) par lot.
	const sortieActive = sorties.find((sortie) => sortie.statut !== "ANNULEE") ?? null;
	const creationBlockedReason =
		finalite !== "GROSSISSEMENT"
			? `Finalité du stock : ${finalite === "VENTE" ? "vente" : "non définie"}. Seule la sortie vers le grossissement est disponible pour l'instant.`
			: isClosed
				? "Le stock est clôturé : aucune nouvelle sortie n'est possible."
				: lotStade !== null && lotStade !== "EN_STOCK"
					? "Le lot n'est plus au stade « En stock » : aucune nouvelle sortie n'est possible."
					: sortieActive
						? `Une sortie ${sortieActive.statut === "BROUILLON" ? "en brouillon" : "validée"} existe déjà pour ce lot.`
						: "";

	const filteredSorties = sorties.filter(
		(sortie) =>
			(statutFilter === "TOUS" || sortie.statut === statutFilter) &&
			matchesSearch(
				[
					sortie.reference_lot,
					sortie.reference_bassin_source,
					sortie.reference_bassin_destination,
					STATUT_SORTIE_LABELS[sortie.statut],
					TYPE_SORTIE_LABELS[sortie.type_sortie] ?? sortie.type_sortie,
					sortie.observation,
					sortie.justification_ecart,
					sortie.motif_annulation,
					formatDateTime(sortie.date_sortie),
				],
				search,
			),
	);
	const { items: visible, currentPage, totalPages, goToPage, startItem, endItem } = usePagination(
		filteredSorties,
		rowsPerPage,
	);

	function openForm(sortie: SortieStock | null) {
		setMessage("");
		setEdition(sortie);
		setIsFormOpen(true);
	}

	function closeForm() {
		setIsFormOpen(false);
		setEdition(null);
	}

	return (
		<section className="ecloserie-section" aria-label="Historique de sortie">
			<SectionHeading
				title="Historique de sortie"
				action={
					!creationBlockedReason && !isFormOpen ? (
						<button className="button button-primary" type="button" onClick={() => openForm(null)} disabled={isLoading}>
							Créer une sortie
						</button>
					) : undefined
				}
			/>

			{!isLoading && !loadError && creationBlockedReason && <p className="helper-text">{creationBlockedReason}</p>}
			{message && <p className="form-success" role="status">{message}</p>}

			{isFormOpen && (
				<SortieStockForm
					key={edition?.id ?? "new"}
					lotId={lotId}
					dateMiseEnStock={dateMiseEnStock}
					bassins={bassins}
					sortie={edition}
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
				<p className="list-empty-state" role="status">Chargement de l&apos;historique…</p>
			) : (
				<div className="list-content">
					<div className="list-toolbar">
						<ListSearch
							value={search}
							onChange={(value) => {
								setSearch(value);
								goToPage(1);
							}}
							placeholder="Bassin, statut, observation..."
							label="Filtrer l'historique des sorties"
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
								<option value="BROUILLON">Brouillons</option>
								<option value="VALIDEE">Validées</option>
								<option value="ANNULEE">Annulées</option>
							</select>
						</label>
						<span className="list-result-count" aria-live="polite">
							{filteredSorties.length} sortie{filteredSorties.length > 1 ? "s" : ""}
						</span>
					</div>

					{visible.length > 0 ? (
						<DataTable
							className="ecloserie-table table-with-actions"
							headers={[
								"Date de sortie",
								"Type",
								"Bassin source → destination",
								"Hapas vidés",
								"Effectif sortant",
								"Effectif entrant",
								"Écart",
								"Statut",
								"Actions",
							]}
							rows={visible.map((sortie) => [
								formatDateTime(sortie.date_sortie),
								TYPE_SORTIE_LABELS[sortie.type_sortie] ?? sortie.type_sortie,
								`${sortie.reference_bassin_source ?? "—"} → ${sortie.reference_bassin_destination}`,
								sortie.lignes.length > 0
									? sortie.lignes
											.map((ligne) => `${ligne.nom_hapa} (${ligne.quantite.toLocaleString("fr-FR")})`)
											.join(", ")
									: "—",
								formatEffectif(sortie.effectif_sortant),
								formatEffectif(sortie.effectif_entrant),
								sortie.ecart_effectif ? (
									<span key={`${sortie.id}-ecart`} title={sortie.justification_ecart || undefined}>
										{sortie.ecart_effectif.toLocaleString("fr-FR")}
									</span>
								) : (
									"—"
								),
								<span
									key={`${sortie.id}-statut`}
									className={STATUT_BADGES[sortie.statut]}
									title={sortie.motif_annulation ? `Motif : ${sortie.motif_annulation}` : undefined}
								>
									{STATUT_SORTIE_LABELS[sortie.statut]}
								</span>,
								sortie.statut === "ANNULEE" ? (
									"—"
								) : (
									<div key={`${sortie.id}-actions`} className="lot-actions">
										{sortie.statut === "BROUILLON" && (
											<>
												<button
													type="button"
													className="button button-ghost icon-button"
													onClick={() => openForm(sortie)}
													aria-label={`Modifier la sortie du ${formatDateTime(sortie.date_sortie)}`}
													title="Modifier"
												>
													<ActionIcon name="edit" />
												</button>
												<button
													type="button"
													className="button button-primary icon-button"
													onClick={() => {
														setMessage("");
														setValidation(sortie);
													}}
													aria-label={`Valider la sortie du ${formatDateTime(sortie.date_sortie)}`}
													title="Valider"
												>
													<ActionIcon name="validate" />
												</button>
											</>
										)}
										<button
											type="button"
											className="button button-danger icon-button"
											onClick={() => {
												setMessage("");
												setAnnulation(sortie);
											}}
											aria-label={`Annuler la sortie du ${formatDateTime(sortie.date_sortie)}`}
											title="Annuler"
										>
											<ActionIcon name="cancel" />
										</button>
									</div>
								),
							])}
						/>
					) : (
						<p className="list-empty-state">
							{sorties.length === 0 ? "Aucune sortie enregistrée." : "Aucune sortie ne correspond aux filtres."}
						</p>
					)}

					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						totalItems={filteredSorties.length}
						startItem={startItem}
						endItem={endItem}
						onPageChange={goToPage}
					/>
				</div>
			)}

			{validation && (
				<ValidationSortieDialog
					sortie={validation}
					onClose={() => setValidation(null)}
					onValidated={async () => {
						setValidation(null);
						setMessage("Sortie validée : le lot est transféré en grossissement.");
						await load();
						onLotChanged();
					}}
				/>
			)}

			{annulation && (
				<AnnulationDialog
					title="Annuler la sortie"
					description={
						annulation.statut === "VALIDEE"
							? `Sortie validée du ${formatDateTime(annulation.date_sortie)} vers ${annulation.reference_bassin_destination}. Les mouvements d'effectif seront annulés, le lot de grossissement créé sera supprimé et le lot repassera en stock. Impossible si le lot de grossissement a déjà un poids initial ou un historique.`
							: `Brouillon de sortie du ${formatDateTime(annulation.date_sortie)} vers ${annulation.reference_bassin_destination}.`
					}
					onClose={() => setAnnulation(null)}
					onConfirm={async (motif) => {
						const etaitValidee = annulation.statut === "VALIDEE";
						await annulerSortie(annulation.id, motif);
						setAnnulation(null);
						setMessage(etaitValidee ? "Sortie annulée : le lot est revenu en stock." : "Brouillon de sortie annulé.");
						await load();
						if (etaitValidee) onLotChanged();
					}}
				/>
			)}
		</section>
	);
}
