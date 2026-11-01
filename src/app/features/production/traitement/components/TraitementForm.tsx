"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { apiRequest } from "@/lib/apiClient";

type ApiHapa = {
	id: number;
	nom: string;
	actif: boolean;
	statut: string;
};

type ApiBassin = {
	id: number;
	reference: string;
	categorie: string;
	statut: string;
	hapas: ApiHapa[];
};

type ApiLot = {
	id: number;
	reference: string;
	quantite_initiale: number;
	parcours_production: string;
	stade: string;
};

type ApiProvende = {
	id: number;
	reference: string;
	type_provende: number;
};

type ApiTypeProvende = {
	id: number;
	type: string;
};

type ApiTraitement = {
	id_lot: number;
};

type ApiListResponse<T> = T[] | { results: T[] };

function getResults<T>(response: ApiListResponse<T>): T[] {
	return Array.isArray(response) ? response : response.results;
}

export function TraitementForm() {
	const router = useRouter();
	const [lots, setLots] = useState<ApiLot[]>([]);
	const [bassins, setBassins] = useState<ApiBassin[]>([]);
	const [provendes, setProvendes] = useState<ApiProvende[]>([]);
	const [lotId, setLotId] = useState("");
	const [bassinId, setBassinId] = useState("");
	const [provendeId, setProvendeId] = useState("");
	const [startDate, setStartDate] = useState("");
	const [initialCount, setInitialCount] = useState("");
	const [hapaCounts, setHapaCounts] = useState<Record<number, string>>({});
	const [observation, setObservation] = useState("");
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");

	const selectedLot = lots.find((lot) => String(lot.id) === lotId);
	const selectedBassin = bassins.find((bassin) => String(bassin.id) === bassinId);
	const activeHapas = useMemo(
		() => selectedBassin?.hapas.filter((hapa) => hapa.actif && hapa.statut === "ACTIF") ?? [],
		[selectedBassin],
	);
	const eligibleLots = lots.filter(
		(lot) =>
			lot.stade === "CREEE" &&
			lot.parcours_production !== "SANS_TRAITEMENT",
	);

	useEffect(() => {
		let isActive = true;

		async function loadOptions() {
			const accessToken = localStorage.getItem("access_token");
			if (!accessToken) {
				setError("Votre session a expiré. Veuillez vous reconnecter.");
				setLoading(false);
				return;
			}

			try {
				const headers = { Authorization: `Bearer ${accessToken}` };
				const [lotsResponse, bassinsResponse, provendesResponse, typesResponse, traitementsResponse] =
					await Promise.all([
						apiRequest<ApiListResponse<ApiLot>>("/api/v1/lots/", { headers }),
						apiRequest<ApiListResponse<ApiBassin>>(
							"/api/v1/bassins/?categorie=TRAITEMENT&statut=ACTIF",
							{ headers },
						),
						apiRequest<ApiListResponse<ApiProvende>>("/api/v1/provende/", { headers }),
						apiRequest<ApiListResponse<ApiTypeProvende>>("/api/v1/provende/types/", { headers }),
						apiRequest<ApiListResponse<ApiTraitement>>("/api/v1/traitement/", { headers }),
					]);
				const treatmentTypeId = getResults(typesResponse).find(
					(type) => type.type === "TRAITEMENT",
				)?.id;
				const treatedLotIds = new Set(
					getResults(traitementsResponse).map((traitement) => traitement.id_lot),
				);

				if (isActive) {
					setLots(
						getResults(lotsResponse).filter(
							(lot) =>
								lot.stade === "CREEE" &&
								lot.parcours_production !== "SANS_TRAITEMENT" &&
								!treatedLotIds.has(lot.id),
						),
					);
					setBassins(
						getResults(bassinsResponse).filter(
							(bassin) =>
								bassin.categorie === "TRAITEMENT" &&
								bassin.statut === "ACTIF",
						),
					);
					setProvendes(
						treatmentTypeId === undefined
							? []
							: getResults(provendesResponse).filter(
									(provende) => provende.type_provende === treatmentTypeId,
								),
					);
				}
			} catch (loadError) {
				if (isActive) {
					setError(
						loadError instanceof Error
							? loadError.message
							: "Impossible de charger les données du traitement.",
					);
				}
			} finally {
				if (isActive) {
					setLoading(false);
				}
			}
		}

		void loadOptions();

		return () => {
			isActive = false;
		};
	}, []);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");

		const effectif = Number(initialCount);
		if (!Number.isInteger(effectif) || effectif <= 0) {
			setError("L'effectif initial doit être un nombre entier strictement supérieur à zéro.");
			return;
		}
		if (selectedLot && effectif > selectedLot.quantite_initiale) {
			setError(
				`L'effectif initial ne peut pas dépasser celui du lot (${selectedLot.quantite_initiale}).`,
			);
			return;
		}

		const hapas = activeHapas.flatMap((hapa) => {
			const value = hapaCounts[hapa.id]?.trim();
			if (!value) {
				return [];
			}
			return [{ id_hapa: hapa.id, effectif_initial: Number(value) }];
		});

		if (activeHapas.length > 0) {
			if (
				hapas.length === 0 ||
				hapas.some(
					(hapa) =>
						!Number.isInteger(hapa.effectif_initial) ||
						hapa.effectif_initial <= 0,
				)
			) {
				setError("Saisissez un effectif positif pour au moins un hapa actif.");
				return;
			}
			if (hapas.reduce((total, hapa) => total + hapa.effectif_initial, 0) !== effectif) {
				setError("La somme des effectifs par hapa doit être égale à l'effectif initial du traitement.");
				return;
			}
		}

		const accessToken = localStorage.getItem("access_token");
		if (!accessToken) {
			setError("Votre session a expiré. Veuillez vous reconnecter.");
			return;
		}

		setSubmitting(true);
		try {
			await apiRequest<{ id: number }>("/api/v1/traitement/", {
				method: "POST",
				headers: { Authorization: `Bearer ${accessToken}` },
				body: JSON.stringify({
					id_lot: Number(lotId),
					id_bassin: Number(bassinId),
					id_used_provende: Number(provendeId),
					date_ouverture: startDate,
					effectif_initial: effectif,
					observation: observation.trim(),
					...(activeHapas.length > 0 ? { hapas } : {}),
				}),
			});
			router.push("/production/traitement");
		} catch (submitError) {
			setError(
				submitError instanceof Error
					? submitError.message
					: "Impossible d'enregistrer le traitement.",
			);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<form className="form-card wide" onSubmit={handleSubmit}>
			<div className="form-grid">
				<label>
					Lot
					<select
						value={lotId}
						onChange={(event) => setLotId(event.target.value)}
						required
						disabled={loading || eligibleLots.length === 0}
					>
						<option value="" disabled>
							{loading ? "Chargement des lots..." : "Sélectionner un lot"}
						</option>
						{eligibleLots.map((lot) => (
							<option key={lot.id} value={lot.id}>
								{lot.reference} · {lot.quantite_initiale} poissons
							</option>
						))}
					</select>
				</label>

				<label>
					Bassin de traitement
					<select
						value={bassinId}
						onChange={(event) => {
							setBassinId(event.target.value);
							setHapaCounts({});
						}}
						required
						disabled={loading || bassins.length === 0}
					>
						<option value="" disabled>
							{loading ? "Chargement des bassins..." : "Sélectionner un bassin"}
						</option>
						{bassins.map((bassin) => (
							<option key={bassin.id} value={bassin.id}>
								{bassin.reference}
							</option>
						))}
					</select>
				</label>

				<label>
					Provende de traitement
					<select
						value={provendeId}
						onChange={(event) => setProvendeId(event.target.value)}
						required
						disabled={loading || provendes.length === 0}
					>
						<option value="" disabled>
							{loading ? "Chargement des provendes..." : "Sélectionner une provende"}
						</option>
						{provendes.map((provende) => (
							<option key={provende.id} value={provende.id}>
								{provende.reference}
							</option>
						))}
					</select>
				</label>

				<label>
					Date de début
					<input
						type="date"
						value={startDate}
						onChange={(event) => setStartDate(event.target.value)}
						required
					/>
				</label>
				<label>
					Effectif initial
					<input
						type="number"
						min="1"
						max={selectedLot?.quantite_initiale}
						step="1"
						value={initialCount}
						onChange={(event) => setInitialCount(event.target.value)}
						required
					/>
				</label>
				<label>
					Observation
					<input
						type="text"
						value={observation}
						onChange={(event) => setObservation(event.target.value)}
						placeholder="Ajouter une observation"
					/>
				</label>
			</div>

			{activeHapas.length > 0 && (
				<fieldset className="stock-hapas-section">
					<legend>Répartition des effectifs par hapa</legend>
					<div className="stock-hapas-grid">
						{activeHapas.map((hapa) => (
							<label key={hapa.id}>
								{hapa.nom} · effectif initial
								<input
									type="number"
									min="1"
									step="1"
									value={hapaCounts[hapa.id] ?? ""}
									onChange={(event) =>
										setHapaCounts((current) => ({
											...current,
											[hapa.id]: event.target.value,
										}))
									}
								/>
							</label>
						))}
					</div>
					<p className="helper-text">
						La somme des effectifs saisis doit correspondre à l&apos;effectif initial du traitement.
					</p>
				</fieldset>
			)}

			{!loading && !error && eligibleLots.length === 0 && (
				<p className="helper-text" role="status">Aucun lot éligible à un traitement n&apos;est disponible.</p>
			)}
			{!loading && !error && bassins.length === 0 && (
				<p className="helper-text" role="status">Aucun bassin actif de catégorie traitement n&apos;est disponible.</p>
			)}
			{!loading && !error && provendes.length === 0 && (
				<p className="helper-text" role="status">Aucune provende de type traitement n&apos;est disponible.</p>
			)}
			{error && <p className="login-error" role="alert">{error}</p>}

			<div className="form-actions">
				<Button variant="ghost" href="/production/traitement">Annuler</Button>
				<button
					className="button button-primary"
					type="submit"
					disabled={loading || submitting || eligibleLots.length === 0 || bassins.length === 0 || provendes.length === 0}
				>
					{submitting ? "Enregistrement..." : "Ouvrir le traitement"}
				</button>
			</div>
		</form>
	);
}
