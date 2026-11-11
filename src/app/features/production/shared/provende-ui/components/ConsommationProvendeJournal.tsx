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
import type { JournalHapa } from "@/app/features/production/shared/mortalite-ui/types/mortalite.types";
import { ConsommationProvendeForm } from "@/app/features/production/shared/provende-ui/components/ConsommationProvendeForm";
import {
	annulerConsommation,
	getConsommations,
	getJoursManquants,
	getProvendes,
	getTotauxJournaliers,
	getTypesProvende,
} from "@/app/features/production/shared/provende-ui/services/provendeApi";
import {
	MAX_DISTRIBUTIONS_PAR_JOUR,
	formatKg,
	getProvendeHapaMode,
	toBackendDay,
	toKg,
	type ConsommationProvende,
	type Provende,
	type TotalJournalier,
	type TypeProvendeCode,
} from "@/app/features/production/shared/provende-ui/types/provende.types";

const rowsPerPage = 10;
/** Limite backend de `jours-manquants`. */
const PERIODE_MAX_JOURS = 366;
const PERIODE_DEFAUT_JOURS = 30;

type StatutFilter = "TOUS" | "VALIDE" | "ANNULEE";

/** Clé d'une cible de distribution : un hapa, ou le bassin entier. */
type CibleKey = string;
const BASSIN_ENTIER: CibleKey = "bassin";

export type ConsommationProvendeJournalProps = {
	bassinId: number | null;
	bassinCategorie: string | null;
	/** Hapas de l'opération proposés à la saisie. */
	hapas?: JournalHapa[];
	/** Limite le journal aux hapas fournis (ex. : hapas d'un traitement). */
	restrictToHapas?: boolean;
	/** Date de début de l'opération (YYYY-MM-DD) : les distributions antérieures sont ignorées. */
	dateMin?: string | null;
	/** Types de provende proposés à la saisie ; toutes les provendes si absent. */
	typesAutorises?: TypeProvendeCode[];
	title?: string;
};

function formatDateTime(value: string) {
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? value
		: date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

function addDays(day: string, days: number) {
	const date = new Date(`${day}T00:00:00Z`);
	date.setUTCDate(date.getUTCDate() + days);
	return date.toISOString().slice(0, 10);
}

export function ConsommationProvendeJournal({
	bassinId,
	bassinCategorie,
	hapas = [],
	restrictToHapas = false,
	dateMin = null,
	typesAutorises,
	title = "Journal de consommation de provende",
}: ConsommationProvendeJournalProps) {
	const [consommations, setConsommations] = useState<ConsommationProvende[]>([]);
	const [provendes, setProvendes] = useState<Provende[]>([]);
	const [typeCodes, setTypeCodes] = useState<Map<number, TypeProvendeCode>>(new Map());
	const [totaux, setTotaux] = useState<Map<CibleKey, TotalJournalier[]>>(new Map());
	const [joursManquants, setJoursManquants] = useState<Map<CibleKey, string[]>>(new Map());
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState("");
	const [statsError, setStatsError] = useState("");
	const [message, setMessage] = useState("");

	const [isFormOpen, setIsFormOpen] = useState(false);
	const [correction, setCorrection] = useState<ConsommationProvende | null>(null);
	const [annulation, setAnnulation] = useState<ConsommationProvende | null>(null);

	const [search, setSearch] = useState("");
	const [statutFilter, setStatutFilter] = useState<StatutFilter>("TOUS");
	const [hapaFilter, setHapaFilter] = useState<CibleKey>("TOUS");

	const hapaMode = getProvendeHapaMode(bassinCategorie);
	const scopeHapaIds = useMemo(() => new Set(hapas.map((hapa) => hapa.id)), [hapas]);
	// Clé stable : le parent recrée le tableau `hapas` à chaque rendu.
	const hapaIdsKey = hapas.map((hapa) => hapa.id).join(",");
	const cibles = useMemo<CibleKey[]>(
		() => (hapaIdsKey ? hapaIdsKey.split(",") : [BASSIN_ENTIER]),
		[hapaIdsKey],
	);

	const today = toBackendDay(new Date());
	const periodeMin = useMemo(() => {
		const limite = addDays(today, -(PERIODE_MAX_JOURS - 1));
		const debut = dateMin ?? addDays(today, -(PERIODE_DEFAUT_JOURS - 1));
		if (debut > today) return today;
		return debut < limite ? limite : debut;
	}, [dateMin, today]);

	const loadStats = useCallback(async () => {
		if (bassinId === null) return;
		const periode = { bassin: bassinId, date_min: periodeMin, date_max: today };
		try {
			const [totauxParCible, manquants] = await Promise.all([
				Promise.all(
					cibles.map((cible) =>
						getTotauxJournaliers({ ...periode, hapa: cible === BASSIN_ENTIER ? null : Number(cible) }),
					),
				),
				getJoursManquants(periode),
			]);
			setTotaux(new Map(cibles.map((cible, index) => [cible, totauxParCible[index]])));
			const parCible = new Map<CibleKey, string[]>();
			for (const item of manquants) {
				if (typeof item === "string") {
					parCible.set(BASSIN_ENTIER, [...(parCible.get(BASSIN_ENTIER) ?? []), item]);
				} else {
					parCible.set(String(item.id_hapa), item.jours_manquants);
				}
			}
			setJoursManquants(parCible);
			setStatsError("");
		} catch (error) {
			setStatsError(error instanceof Error ? error.message : "Impossible de charger les indicateurs.");
		}
	}, [bassinId, cibles, periodeMin, today]);

	const load = useCallback(async () => {
		if (bassinId === null) return;
		try {
			const [loadedConsommations, loadedProvendes, loadedTypes] = await Promise.all([
				getConsommations({ bassin: bassinId, date_min: dateMin ?? undefined }),
				getProvendes(),
				getTypesProvende(),
				loadStats(),
			]);
			setConsommations(loadedConsommations);
			setProvendes(loadedProvendes);
			setTypeCodes(new Map(loadedTypes.map((type) => [type.id, type.type])));
			setLoadError("");
		} catch (error) {
			setLoadError(error instanceof Error ? error.message : "Impossible de charger le journal.");
		} finally {
			setIsLoading(false);
		}
	}, [bassinId, dateMin, loadStats]);

	useEffect(() => {
		void Promise.resolve().then(load);
	}, [load]);

	const provendesAutorisees = useMemo(
		() =>
			typesAutorises
				? provendes.filter((provende) => {
						const code = typeCodes.get(provende.type_provende);
						return code !== undefined && typesAutorises.includes(code);
					})
				: provendes,
		[provendes, typeCodes, typesAutorises],
	);

	// En correction, la provende d'origine reste sélectionnable même si son type n'est plus proposé.
	const provendesFormulaire = useMemo(() => {
		if (!correction || provendesAutorisees.some((provende) => provende.id === correction.id_provende)) {
			return provendesAutorisees;
		}
		const origine = provendes.find((provende) => provende.id === correction.id_provende);
		return origine ? [...provendesAutorisees, origine] : provendesAutorisees;
	}, [correction, provendes, provendesAutorisees]);

	const scopedConsommations = useMemo(
		() =>
			consommations.filter(
				(consommation) =>
					!restrictToHapas || (consommation.id_hapa !== null && scopeHapaIds.has(consommation.id_hapa)),
			),
		[consommations, restrictToHapas, scopeHapaIds],
	);

	const ciblesSelectionnees = hapaFilter === "TOUS" ? cibles : [hapaFilter];

	const totalKg = ciblesSelectionnees.reduce(
		(total, cible) => total + (totaux.get(cible) ?? []).reduce((somme, jour) => somme + toKg(jour.total_kg), 0),
		0,
	);
	const restantes = ciblesSelectionnees.reduce((total, cible) => {
		const jour = (totaux.get(cible) ?? []).find((item) => item.date === today);
		return total + (jour ? jour.distributions_restantes : MAX_DISTRIBUTIONS_PAR_JOUR);
	}, 0);
	const capacite = ciblesSelectionnees.length * MAX_DISTRIBUTIONS_PAR_JOUR;
	const joursSansDistribution = new Set(ciblesSelectionnees.flatMap((cible) => joursManquants.get(cible) ?? [])).size;
	const statsReady = !isLoading && !statsError;

	const filteredConsommations = scopedConsommations.filter(
		(consommation) =>
			(statutFilter === "TOUS" || consommation.statut === statutFilter) &&
			(hapaFilter === "TOUS" || String(consommation.id_hapa) === hapaFilter) &&
			matchesSearch(
				[
					consommation.nom_hapa,
					consommation.reference_provende,
					consommation.type_provende,
					toKg(consommation.quantite_kg),
					consommation.observation,
					consommation.motif_annulation,
					formatDateTime(consommation.date_distribution),
				],
				search,
			),
	);
	const { items: visible, currentPage, totalPages, goToPage, startItem, endItem } = usePagination(
		filteredConsommations,
		rowsPerPage,
	);

	function openForm(consommation: ConsommationProvende | null) {
		setMessage("");
		setCorrection(consommation);
		setIsFormOpen(true);
	}

	function closeForm() {
		setIsFormOpen(false);
		setCorrection(null);
	}

	if (bassinId === null) {
		return <p className="list-empty-state">Aucun bassin associé : le journal n&apos;est pas disponible.</p>;
	}

	const periodeLabel = `depuis le ${new Date(`${periodeMin}T00:00:00`).toLocaleDateString("fr-FR")}`;
	const showHapa = hapas.length > 0 || scopedConsommations.some((item) => item.nom_hapa);
	const headers = [
		"Date",
		...(showHapa ? ["Hapa"] : []),
		"Provende",
		"Type",
		"Quantité",
		"Observation",
		"Statut",
		"Actions",
	];

	return (
		<section className="treatment-mortality mortality-journal" aria-label={title}>
			<div className="stats-grid three">
				<StatCard
					label="Provende distribuée"
					value={statsReady ? formatKg(totalKg) : "…"}
					detail={periodeLabel}
				/>
				<StatCard
					label="Distributions restantes aujourd'hui"
					value={statsReady ? `${restantes} / ${capacite}` : "…"}
					detail={`max. ${MAX_DISTRIBUTIONS_PAR_JOUR} par jour et par ${hapas.length > 0 ? "hapa" : "bassin"}`}
				/>
				<StatCard
					label="Jours sans distribution"
					value={statsReady ? joursSansDistribution.toLocaleString("fr-FR") : "…"}
					detail={
						ciblesSelectionnees.length > 1
							? `${periodeLabel}, sur au moins un hapa`
							: `${periodeLabel}, avec poissons présents`
					}
				/>
			</div>
			{statsError && <p className="form-error" role="alert">{statsError}</p>}

			<div className="treatment-mortality-heading">
				<h2>{title}</h2>
				{!isFormOpen && (
					<button className="button button-primary" type="button" onClick={() => openForm(null)} disabled={isLoading}>
						+ Consommation
					</button>
				)}
			</div>

			{message && <p className="form-success" role="status">{message}</p>}

			{isFormOpen && (
				<ConsommationProvendeForm
					key={correction?.id ?? "new"}
					bassinId={bassinId}
					hapaMode={hapaMode}
					hapas={hapas}
					provendes={provendesFormulaire}
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
							placeholder="Provende, hapa, observation..."
							label="Rechercher dans le journal de consommation de provende"
						/>
						{hapas.length > 0 && (
							<label className="journal-filter">
								<span>Hapa</span>
								<select
									value={hapaFilter}
									onChange={(event) => {
										setHapaFilter(event.target.value);
										goToPage(1);
									}}
								>
									<option value="TOUS">Tous</option>
									{hapas.map((hapa) => (
										<option key={hapa.id} value={hapa.id}>{hapa.nom}</option>
									))}
								</select>
							</label>
						)}
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
								<option value="VALIDE">Validées</option>
								<option value="ANNULEE">Annulées</option>
							</select>
						</label>
						<span className="list-result-count" aria-live="polite">
							{filteredConsommations.length} distribution{filteredConsommations.length > 1 ? "s" : ""}
						</span>
					</div>
					{visible.length > 0 ? (
						<DataTable
							className="treatment-journal-table table-with-actions journal-table"
							headers={headers}
							rows={visible.map((consommation) => {
								const isValide = consommation.statut === "VALIDE";
								return [
									formatDateTime(consommation.date_distribution),
									...(showHapa ? [consommation.nom_hapa ?? "Bassin entier"] : []),
									consommation.reference_provende,
									consommation.type_provende,
									formatKg(consommation.quantite_kg),
									consommation.observation || "—",
									isValide ? (
										<span key={`${consommation.id}-statut`} className="badge badge-green">Validée</span>
									) : (
										<span
											key={`${consommation.id}-statut`}
											className="badge badge-amber"
											title={consommation.motif_annulation ? `Motif : ${consommation.motif_annulation}` : undefined}
										>
											Annulée
										</span>
									),
									isValide ? (
										<div key={`${consommation.id}-actions`} className="lot-actions">
											<button
												type="button"
												className="button button-ghost icon-button"
												onClick={() => openForm(consommation)}
												aria-label={`Corriger la distribution du ${formatDateTime(consommation.date_distribution)}`}
												title="Corriger"
											>
												<ActionIcon name="edit" />
											</button>
											<button
												type="button"
												className="button button-danger icon-button"
												onClick={() => {
													setMessage("");
													setAnnulation(consommation);
												}}
												aria-label={`Annuler la distribution du ${formatDateTime(consommation.date_distribution)}`}
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
							{scopedConsommations.length === 0
								? "Aucune consommation enregistrée."
								: "Aucune distribution ne correspond aux filtres."}
						</p>
					)}
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						totalItems={filteredConsommations.length}
						startItem={startItem}
						endItem={endItem}
						onPageChange={goToPage}
					/>
				</div>
			)}

			{annulation && (
				<AnnulationDialog
					title="Annuler la distribution"
					description={`${formatKg(annulation.quantite_kg)} de ${annulation.reference_provende} du ${formatDateTime(annulation.date_distribution)}${annulation.nom_hapa ? ` (${annulation.nom_hapa})` : ""}. La distribution restera visible avec le statut « Annulée ».`}
					onClose={() => setAnnulation(null)}
					onConfirm={async (motif) => {
						await annulerConsommation(annulation.id, motif);
						setAnnulation(null);
						setMessage("Distribution annulée.");
						await load();
					}}
				/>
			)}
		</section>
	);
}
