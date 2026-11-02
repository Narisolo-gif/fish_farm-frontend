"use client";

import { type FormEvent, useState } from "react";
import type {
  EnvironmentalBasin,
  EnvironmentalMeasurementInput,
} from "@/app/features/production/shared/environnement/types/environment.types";

export function EnvironnementParametersForm({
  basins,
  initialBasinId,
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  basins: EnvironmentalBasin[];
  initialBasinId: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (measurement: EnvironmentalMeasurementInput) => void;
}) {
  const [sampledAt, setSampledAt] = useState("");
  const [basin, setBasin] = useState(initialBasinId === "all" ? "" : initialBasinId);
  const [oxygenRate, setOxygenRate] = useState("");
  const [airTemperature, setAirTemperature] = useState("");
  const [waterTemperature, setWaterTemperature] = useState("");
  const [ph, setPh] = useState("");
  const [nitrate, setNitrate] = useState("");
  const [nitrite, setNitrite] = useState("");
  const [ammonia, setAmmonia] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      bassin: Number(basin),
      date_heure_prelevement: new Date(sampledAt).toISOString(),
      oxygene: Number(oxygenRate),
      temperature_air: Number(airTemperature),
      temperature_eau: Number(waterTemperature),
      ph: Number(ph),
      nitrate: Number(nitrate),
      nitrite: Number(nitrite),
      ammoniac: Number(ammonia),
    });
  }

  return (
    <form className="form-card wide environment-parameters-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          Date et heure du prélèvement
          <input
            type="datetime-local"
            value={sampledAt}
            onChange={(event) => setSampledAt(event.target.value)}
            required
          />
        </label>
        <label>
          Bassin
          <select
            value={basin}
            onChange={(event) => setBasin(event.target.value)}
            required
            disabled={basins.length === 0}
          >
            <option value="" disabled>Sélectionner un bassin</option>
            {basins.map((item) => (
              <option key={item.id} value={item.id}>{item.reference}</option>
            ))}
          </select>
        </label>
        <label>
          Taux d&apos;oxygène (mg/L)
          <input
            type="number"
            inputMode="decimal"
            step="any"
            value={oxygenRate}
            onChange={(event) => setOxygenRate(event.target.value)}
            required
          />
        </label>
        <label>
          Température de l&apos;air (°C)
          <input
            type="number"
            inputMode="decimal"
            step="any"
            value={airTemperature}
            onChange={(event) => setAirTemperature(event.target.value)}
            required
          />
        </label>
        <label>
          Température de l&apos;eau (°C)
          <input
            type="number"
            inputMode="decimal"
            step="any"
            value={waterTemperature}
            onChange={(event) => setWaterTemperature(event.target.value)}
            required
          />
        </label>
      </div>

      <div className="form-grid">
        <label>
          pH
          <input type="number" min="0" max="14" step="any" value={ph} onChange={(event) => setPh(event.target.value)} required />
        </label>
        <label>
          Taux de nitrites (mg/L)
          <input type="number" min="0" step="any" value={nitrite} onChange={(event) => setNitrite(event.target.value)} required />
        </label>
        <label>
          Taux de nitrates (mg/L)
          <input type="number" min="0" step="any" value={nitrate} onChange={(event) => setNitrate(event.target.value)} required />
        </label>
        <label>
          Ammoniac (mg/L)
          <input type="number" min="0" step="any" value={ammonia} onChange={(event) => setAmmonia(event.target.value)} required />
        </label>
      </div>

      <div className="form-actions">
        <button className="button button-ghost" type="button" onClick={onCancel} disabled={isSubmitting}>
          Annuler
        </button>
        <button className="button button-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Enregistrement..." : "Enregistrer le prélèvement"}
        </button>
      </div>
    </form>
  );
}