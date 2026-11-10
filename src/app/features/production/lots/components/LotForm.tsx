"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/apiClient";
import {
	createLot,
	getAvailableEclosions,
	getLot,
	updateLot,
} from "@/app/features/production/lots/services/lotApi";
import {
	LOT_PARCOURS_LABELS,
	canEditLot,
	getStadeLabel,
	type LotEclosion,
	type LotParcours,
	type LotRecord,
} from "@/app/features/production/lots/types/lot.types";

type LotFormProps =
	| { mode: "create"; initialEclosionId?: string }
	| { mode: "edit"; lotId: string };

export function LotForm(props: LotFormProps) {
	const router = useRouter();
	const isEdit = props.mode === "edit";
	const lotId = props.mode === "edit" ? props.lotId : "";
	const initialEclosionId = props.mode === "create" ? props.initialEclosionId ?? "" : "";

	const [eclosions, setEclosions] = useState<LotEclosion[]>([]);
	const [lot, setLot] = useState<LotRecord | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState("");

	const [eclosionId, setEclosionId] = useState(initialEclosionId);
	const [reference, setReference] = useState("");
	const [dateCreation, setDateCreation] = useState(() => toLocalDateTimeValue(new Date()));
	const [parcours, setParcours] = useState<LotParcours>("TRAITEMENT_REQUIS");
	const [observations, setObservations] = useState("");

	const [saveError, setSaveError] = useState("");
	const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		let isActive = true;

		async function load() {
			try {
				if (isEdit) {
					const loadedLot = await getLot(lotId);
					if (!isActive) return;
					setLot(loadedLot);
					setReference(loadedLot.reference);
					setDateCreation(toLocalDateTimeValue(new Date(loadedLot.date_creation)));
					setParcours(loadedLot.parcours_production);
					setObservations(loadedLot.observations ?? "");
				} else {
					const available = await getAvailableEclosions();
					if (!isActive) return;
					setEclosions(available);
					if (initialEclosionId && !available.some((item) => String(item.id) === initialEclosionId)) {
						setEclosionId("");
					}
				}
			} catch (error) {
				if (isActive) {
					setLoadError(error instanceof Error ? error.message : "Impossible de charger les données.");
				}
			} finally {
				if (isActive) setIsLoading(false);
			}
		}

		void load();
		return () => {
			isActive = false;
		};
	}, [isEdit, lotId, initialEclosionId]);

	const selectedEclosion = eclosions.find((eclosion) => String(eclosion.id) === eclosionId);
	const isLocked = isEdit && lot !== null && !canEditLot(lot);
	const cancelHref = isEdit ? `/production/lots/${lotId}` : "/production/lots";

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSaveError("");
		setFieldErrors({});

		const date = new Date(dateCreation);
		if (!reference.trim() || Number.isNaN(date.getTime()) || (!isEdit && !selectedEclosion)) {
			setSaveError("Vérifiez les champs obligatoires.");
			return;
		}

		setIsSubmitting(true);
		try {
			const common = {
				reference: reference.trim(),
				date_creation: date.toISOString(),
				observations: observations.trim(),
			};
			const saved = isEdit
				? await updateLot(lotId, common)
				: await createLot({
						...common,
						id_eclosion: selectedEclosion!.id,
						parcours_production: parcours,
					});
			router.push(`/production/lots/${saved.id}`);
		} catch (error) {
			if (error instanceof ApiError) {
				setFieldErrors(error.fieldErrors);
				setSaveError(error.generalMessage || (Object.keys(error.fieldErrors).length ? "" : error.message));
			} else {
				setSaveError(error instanceof Error ? error.message : "Impossible d'enregistrer ce lot.");
			}
			setIsSubmitting(false);
		}
	}

	if (isLoading) {
		return <p className="list-empty-state" role="status">Chargement…</p>;
	}

	if (loadError) {
		return <p className="form-error" role="alert">{loadError}</p>;
	}

	const noEclosion = !isEdit && eclosions.length === 0;
	const disabled = isSubmitting || isLocked;

	return (
		<form className="form-card wide reproduction-entry-form" onSubmit={handleSubmit}>
			<h2>{isEdit ? `Modifier le lot ${lot?.reference ?? ""}` : "Nouveau lot"}</h2>
			{isLocked && (
				<p className="form-error" role="alert">Un lot clôturé ne peut plus être modifié.</p>
			)}
			{noEclosion && (
				<p className="form-error" role="status">
					Aucune éclosion disponible. Chaque éclosion active ne peut donner qu&apos;un seul lot :
					enregistrez d&apos;abord une nouvelle éclosion dans le module Écloserie.
				</p>
			)}
			<div className="form-grid">
				<label>
					Éclosion d&apos;origine
					{isEdit ? (
						<input type="text" value={lot?.reference_eclosion ?? ""} disabled readOnly />
					) : (
						<select
							value={eclosionId}
							onChange={(event) => setEclosionId(event.target.value)}
							required
							disabled={disabled || noEclosion}
						>
							<option value="" disabled>Sélectionner une éclosion</option>
							{eclosions.map((eclosion) => (
								<option key={eclosion.id} value={eclosion.id}>
									{eclosion.reference} · {formatDate(eclosion.date_eclosion)} ·{" "}
									{eclosion.quantite_alevins_obtenu.toLocaleString("fr-FR")} alevins
								</option>
							))}
						</select>
					)}
					<FieldError messages={fieldErrors.id_eclosion} />
				</label>
				<label>
					Référence du lot
					<input
						type="text"
						maxLength={100}
						value={reference}
						onChange={(event) => setReference(event.target.value)}
						required
						disabled={disabled}
					/>
					<FieldError messages={fieldErrors.reference} />
				</label>
				<label>
					Date de création
					<input
						type="datetime-local"
						value={dateCreation}
						onChange={(event) => setDateCreation(event.target.value)}
						required
						disabled={disabled}
					/>
					<FieldError messages={fieldErrors.date_creation} />
				</label>
				<label>
					Parcours de production
					<select
						value={parcours}
						onChange={(event) => setParcours(event.target.value as LotParcours)}
						disabled={disabled || isEdit}
					>
						{Object.entries(LOT_PARCOURS_LABELS).map(([value, label]) => (
							<option key={value} value={value}>{label}</option>
						))}
					</select>
					{isEdit && <small className="helper-text">Le parcours ne peut plus changer après la création.</small>}
					<FieldError messages={fieldErrors.parcours_production} />
				</label>
				<label>
					Quantité initiale
					<input
						type="text"
						value={
							isEdit
								? lot?.quantite_initiale.toLocaleString("fr-FR") ?? ""
								: selectedEclosion?.quantite_alevins_obtenu.toLocaleString("fr-FR") ?? "—"
						}
						disabled
						readOnly
					/>
					<small className="helper-text">Reprise automatiquement des alevins obtenus à l&apos;éclosion.</small>
				</label>
				{isEdit && lot && (
					<label>
						Stade actuel
						<input type="text" value={getStadeLabel(lot.stade)} disabled readOnly />
					</label>
				)}
			</div>
			<label>
				Observations
				<textarea value={observations} onChange={(event) => setObservations(event.target.value)} disabled={disabled} />
				<FieldError messages={fieldErrors.observations} />
			</label>
			{saveError && <p className="form-error" role="alert">{saveError}</p>}
			<div className="form-actions">
				<button className="button button-ghost" type="button" onClick={() => router.push(cancelHref)} disabled={isSubmitting}>
					Annuler
				</button>
				<button className="button button-primary" type="submit" disabled={disabled || noEclosion}>
					{isSubmitting ? "Enregistrement..." : isEdit ? "Enregistrer les modifications" : "Créer le lot"}
				</button>
			</div>
		</form>
	);
}

function FieldError({ messages }: { messages?: string[] }) {
	if (!messages || messages.length === 0) return null;
	return <small className="form-error">{messages.join(" ")}</small>;
}

function formatDate(value: string) {
	const date = new Date(`${value}T00:00:00`);
	return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR");
}

function toLocalDateTimeValue(date: Date) {
	const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
	return local.toISOString().slice(0, 16);
}
