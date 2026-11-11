"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import {
	createStock,
	getStockFormOptions,
	type FinaliteStock,
	type StockBassin,
	type StockLot,
	type StockTreatment,
} from "@/app/features/production/stocks/services/stockApi";

export function StockForm({ initialLotId }: { initialLotId?: string } = {}) {
    const router = useRouter();
    const [lots, setLots] = useState<StockLot[]>([]);
    const [basins, setBasins] = useState<StockBassin[]>([]);
    const [treatments, setTreatments] = useState<StockTreatment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lotId, setLotId] = useState(initialLotId ?? "");
    const [basinId, setBasinId] = useState("");
    const [finalite, setFinalite] = useState<FinaliteStock | "">("");
    const [effectifEntrant, setEffectifEntrant] = useState("");
    const [hapaEffectifs, setHapaEffectifs] = useState<Record<number, string>>({});
    const [justification, setJustification] = useState("");
    const [observation, setObservation] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        let isActive = true;

        async function loadOptions() {
            try {
                const options = await getStockFormOptions();
                if (isActive) {
                    setLots(options.lots);
                    setBasins(options.basins);
                    setTreatments(options.treatments);
                }
            } catch (loadError) {
                if (isActive) {
                    setError(
                        loadError instanceof Error
                            ? loadError.message
                            : "Impossible de charger les lots et bassins disponibles.",
                    );
                }
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        }

        void loadOptions();

        return () => {
            isActive = false;
        };
    }, []);

    const eligibleLots = useMemo(
        () =>
            lots.filter((lot) => {
                if (lot.stade !== "CREEE" && lot.stade !== "EN_TRAITEMENT") {
                    return false;
                }
                const treatment = treatments.find((item) => item.id_lot === lot.id);
                if (!treatment) {
                    return lot.stade === "CREEE";
                }
                return treatment.statut === "CLOTUREE" && (treatment.effectif_final ?? 0) > 0;
            }),
        [lots, treatments],
    );
    const selectedLot = eligibleLots.find((lot) => String(lot.id) === lotId);
    const selectedTreatment = selectedLot
        ? treatments.find((treatment) => treatment.id_lot === selectedLot.id)
        : undefined;
    const selectedBasin = basins.find((basin) => String(basin.id) === basinId);
    const activeHapas = selectedBasin?.hapas.filter(
        (hapa) => hapa.actif && hapa.statut === "ACTIF",
    ) ?? [];
    const hapaLines = activeHapas.flatMap((hapa) => {
        const quantity = hapaEffectifs[hapa.id]?.trim();
        return quantity ? [{ id_hapa: hapa.id, effectif_entrant: Number(quantity) }] : [];
    });
    const totalQuantity = activeHapas.length > 0
        ? hapaLines.reduce((total, line) => total + line.effectif_entrant, 0)
        : Number(effectifEntrant);

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        if (!selectedLot || !selectedBasin) {
            setError("Sélectionnez un lot et un bassin de stock actifs.");
            return;
        }
        if (!finalite) {
            setError("La finalité est obligatoire à la création.");
            return;
        }
        if (!Number.isInteger(totalQuantity) || totalQuantity <= 0) {
            setError("L'effectif entrant doit être un nombre entier strictement positif.");
            return;
        }
        if (hapaLines.some((line) => !Number.isInteger(line.effectif_entrant) || line.effectif_entrant <= 0)) {
            setError("L'effectif de chaque hapa renseigné doit être un entier strictement positif.");
            return;
        }

        const effectifReference = selectedTreatment
            ? selectedTreatment.effectif_final
            : selectedLot.quantite_initiale;
        if (effectifReference === null || effectifReference === undefined) {
            setError("L'effectif final du traitement n'est pas renseigné.");
            return;
        }
        if (totalQuantity > effectifReference) {
            setError(`L'effectif entrant ne peut pas dépasser l'effectif de référence (${effectifReference}).`);
            return;
        }
        if (selectedTreatment && totalQuantity !== effectifReference) {
            setError("Après traitement, l'effectif entrant doit correspondre à l'effectif final du traitement.");
            return;
        }
        if (!selectedTreatment && totalQuantity !== selectedLot.quantite_initiale && !justification.trim()) {
            setError("Une justification est obligatoire lorsque l'effectif entrant diffère de la quantité initiale du lot.");
            return;
        }

        const accessToken = localStorage.getItem("access_token");
        if (!accessToken) {
            setError("Votre session a expiré. Veuillez vous reconnecter.");
            return;
        }

        setIsSubmitting(true);
        void createStock({
            id_lot: selectedLot.id,
            id_bassin: selectedBasin.id,
            finalite,
            ...(activeHapas.length > 0
                ? { hapas: hapaLines }
                : { effectif_entrant: totalQuantity }),
            justification_ecart: justification.trim(),
            observation: observation.trim(),
        })
            .then(() => router.push("/production/stock"))
            .catch((submitError: unknown) => {
                setError(
                    submitError instanceof Error
                        ? submitError.message
                        : "Impossible d'enregistrer la mise en stock.",
                );
            })
            .finally(() => setIsSubmitting(false));
    }

    return (
        <form className="form-card wide" onSubmit={handleSubmit}>
            {error && <p className="form-error" role="alert">{error}</p>}
            {isLoading ? (
                <p role="status">Chargement des lots et bassins disponibles...</p>
            ) : (
                <>
                    <div className="form-grid stock-details-grid">
                        <label>
                            Lot
                            <select
                                value={lotId}
                                onChange={(event) => {
                                    setLotId(event.target.value);
                                    setJustification("");
                                    setEffectifEntrant("");
                                    setHapaEffectifs({});
                                }}
                                required
                            >
                                <option value="" disabled>Sélectionner un lot</option>
                                {eligibleLots.map((lot) => (
                                    <option key={lot.id} value={lot.id}>
                                        {lot.reference} · quantité initiale {lot.quantite_initiale}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Bassin de stock
                            <select
                                value={basinId}
                                onChange={(event) => {
                                    setBasinId(event.target.value);
                                    setHapaEffectifs({});
                                    setEffectifEntrant("");
                                }}
                                required
                            >
                                <option value="" disabled>Sélectionner un bassin actif</option>
                                {basins.map((basin) => (
                                    <option key={basin.id} value={basin.id}>{basin.reference}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Finalité
                            <select
                                value={finalite}
                                onChange={(event) => setFinalite(event.target.value as FinaliteStock)}
                                required
                            >
                                <option value="" disabled>Sélectionner la finalité</option>
                                <option value="GROSSISSEMENT">Grossissement</option>
                                <option value="VENTE">Vente</option>
                            </select>
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

                    {selectedLot && (
                        <p className="helper-text">
                            {selectedTreatment
                                ? `Traitement clôturé — effectif entrant obligatoire : ${selectedTreatment.effectif_final}.`
                                : `Effectif entrant maximal : ${selectedLot.quantite_initiale}.`}
                        </p>
                    )}

                    {activeHapas.length > 0 ? (
                        <fieldset className="stock-hapas-section">
                            <legend>Effectif par hapa actif</legend>
                            <div className="stock-hapas-grid">
                                {activeHapas.map((hapa) => (
                                    <label key={hapa.id}>
                                        {hapa.nom}
                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={hapaEffectifs[hapa.id] ?? ""}
                                            onChange={(event) => setHapaEffectifs((current) => ({
                                                ...current,
                                                [hapa.id]: event.target.value,
                                            }))}
                                        />
                                    </label>
                                ))}
                                <label className="stock-total-field">
                                    Effectif total
                                    <input type="number" value={totalQuantity || ""} readOnly aria-live="polite" />
                                </label>
                            </div>
                        </fieldset>
                    ) : selectedBasin ? (
                        <label>
                            Effectif entrant
                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={effectifEntrant}
                                onChange={(event) => setEffectifEntrant(event.target.value)}
                                required
                            />
                        </label>
                    ) : null}

                    {selectedLot && !selectedTreatment && totalQuantity > 0 &&
                        totalQuantity !== selectedLot.quantite_initiale && (
                            <label>
                                Justification de l&apos;écart
                                <textarea
                                    value={justification}
                                    onChange={(event) => setJustification(event.target.value)}
                                    required
                                />
                            </label>
                        )}
                </>
            )}
            {!isLoading && eligibleLots.length === 0 && !error && (
                <p className="list-empty-state">Aucun lot n&apos;est actuellement éligible à une mise en stock.</p>
            )}
            {!isLoading && basins.length === 0 && !error && (
                <p className="list-empty-state">Aucun bassin actif de catégorie Stocks n&apos;est disponible.</p>
            )}
            <div className="form-actions">
                <Button variant="ghost" href="/production/stock">Annuler</Button>
                <button
                    className="button button-primary"
                    type="submit"
                    disabled={isLoading || isSubmitting || eligibleLots.length === 0 || basins.length === 0}
                >
                    {isSubmitting ? "Enregistrement..." : "Ajouter au stock"}
                </button>
            </div>
        </form>
    );
}