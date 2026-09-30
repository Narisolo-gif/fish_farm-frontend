"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { BassinSelector } from "@/app/features/production/shared/bassins/components/BassinSelector";
import { LotSelector } from "@/app/features/production/shared/lot/components/LotSelector";

export function StockForm() {
    const [lotId, setLotId] = useState("");
    const [basin, setBasin] = useState("");
    const [hapasA, setHapasA] = useState("");
    const [hapasB, setHapasB] = useState("");
    const [hapasC, setHapasC] = useState("");
    const [totalQuantity, setTotalQuantity] = useState(0);
    const [startDate, setStartDate] = useState("");
    const [observation, setObservation] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        let isCurrent = true;

        Promise.resolve().then(() => {
            const total = [hapasA, hapasB, hapasC].reduce(
                (sum, quantity) => sum + (Number(quantity) || 0),
                0,
            );

            if (isCurrent) {
                setTotalQuantity(total);
            }
        });

        return () => {
            isCurrent = false;
        };
    }, [hapasA, hapasB, hapasC]);

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const payload = {
            lotId,
            basin,
            quantiteHapasA: Number(hapasA),
            quantiteHapasB: Number(hapasB),
            quantiteHapasC: Number(hapasC),
            quantiteTotale: Number(hapasA) + Number(hapasB) + Number(hapasC),
            startDate,
            observation,
        };

        setMessage(`Le formulaire est valide (quantité totale : ${payload.quantiteTotale}), mais l'enregistrement n'est pas encore connecté à l'API.`);
    }

    return (
        <form className="form-card wide" onSubmit={handleSubmit}>
            <div className="form-grid stock-details-grid">
                <LotSelector value={lotId} onChange={setLotId} />
                <BassinSelector value={basin} onChange={setBasin} />
                <label>
                    Date Entrée
                    <input
                        type="date"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
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
             <fieldset className="stock-hapas-section">
                <legend>Quantités par hapa</legend>
                <div className="stock-hapas-grid">
                    <label>
                        Hapas A
                        <input
                            type="number"
                            name="quantiteHapasA"
                            min="0"
                            step="1"
                            value={hapasA}
                            onChange={(event) => setHapasA(event.target.value)}
                            required
                        />
                    </label>
                    <label>
                        Hapas B
                        <input
                            type="number"
                            name="quantiteHapasB"
                            min="0"
                            step="1"
                            value={hapasB}
                            onChange={(event) => setHapasB(event.target.value)}
                            required
                        />
                    </label>
                    <label>
                        Hapas C
                        <input
                            type="number"
                            name="quantiteHapasC"
                            min="0"
                            step="1"
                            value={hapasC}
                            onChange={(event) => setHapasC(event.target.value)}
                            required
                        />
                    </label>
                    <label className="stock-total-field">
                        Quantité totale
                        <input
                            type="number"
                            name="quantiteTotale"
                            value={totalQuantity}
                            readOnly
                            aria-live="polite"
                        />
                    </label>
                </div>
            </fieldset>
            <p className="helper-text">Les lots et bassins affichés sont des exemples en attente de connexion aux données de production.</p>
            {message && <p className="helper-text" role="status">{message}</p>}
            <div className="form-actions">
                <Button variant="ghost" href="/production/stock">Annuler</Button>
                <button className="button button-primary" type="submit">Ajouter au stock</button>
            </div>
        </form>
    );
}