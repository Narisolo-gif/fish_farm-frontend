"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui";
import { Breadcrumb, PageHeader } from "@/components/PageHeader";

export default function NewBasinPage() {
    const [hapas, setHapas] = useState<number[]>([]);
    const nextHapaId = useRef(0);

    function addHapa() {
        nextHapaId.current += 1;
        setHapas((currentHapas) => [...currentHapas, nextHapaId.current]);
    }

    function removeHapa(id: number) {
        setHapas((currentHapas) => currentHapas.filter((hapaId) => hapaId !== id));
    }

    return (
        <div className="page">
            <Breadcrumb items={["Bassins", "Nouveau"]} />
            <PageHeader
                title="Configuration bassin"
                description="Ajoutez un bassin et ses paramètres de capacité."
            />
            <form className="form-card wide">
                <div className="form-grid">
                    <Field label="Référence" placeholder="B-03" />
                    <label>
                        Type
                        <select defaultValue="">
                            <option value="" disabled>
                                Sélectionner une catégorie
                            </option>
                            <option value="reproduction">reproduction</option>
                            <option value="ecloserie">ecloserie</option>
                            <option value="traitement">traitement</option>
                            <option value="stocks">stocks</option>
                            <option value="grossissement">grossissement</option>
                        </select>
                    </label>
                    <Field label="Capacité max" placeholder="Ex. 240" />
                </div>
                <label>
                    Description
                    <textarea placeholder="Notes et informations complémentaires" />
                </label>
                <div className="subsection">
                    <div className="subsection-heading">
                        <strong>Happas de ce bassin</strong>
                        <button type="button" className="button button-ghost" onClick={addHapa}>
                            + Ajouter hapa
                        </button>
                    </div>
                    {hapas.length > 0 && (
                        <div className="happa-list">
                            {hapas.map((id, index) => (
                                <div className="happa-input" key={id}>
                                    <span>{String(index + 1).padStart(2, "0")}</span>
                                    <input placeholder="Référence" />
                                    <input placeholder="Capacité max" />
                                    <button
                                        type="button"
                                        aria-label={`Supprimer le hapa ${index + 1}`}
                                        onClick={() => removeHapa(id)}
                                    >
                                        x
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="form-actions">
                    <Button variant="ghost" href="/production/grossissement">
                        Annuler
                    </Button>
                    <Button>Enregistrer le bassin</Button>
                </div>
            </form>
        </div>
    );
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
    return (
        <label>
            {label}
            <input placeholder={placeholder} />
        </label>
    );
}
