"use client";

import { type FormEvent, useState } from "react";
import type {
  EnvironmentalBasin,
  EnvironmentalMeasurementInput,
} from "@/app/features/production/shared/environnement/types/environment.types";

const phOptions = [6.2, 6.8, 7.2, 7.6, 7.8, 8.1];
const nitrateOptions = [0, 10, 20, 25, 50, 100, 250];
const nitriteOptions = [0, 1, 5, 10];
const ammoniaOptions = [0, 0.5, 1, 3, 5, 10];

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
  const [ph, setPh] = useState<number | null>(null);
  const [nitrate, setNitrate] = useState<number | null>(null);
  const [nitrite, setNitrite] = useState<number | null>(null);
  const [ammonia, setAmmonia] = useState<number | null>(null);
  const [measurementError, setMeasurementError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (ph === null || nitrate === null || nitrite === null || ammonia === null) {
      setMeasurementError("Sélectionnez une valeur pour chaque paramètre environnemental.");
      return;
    }

    setMeasurementError("");
    onSubmit({
      bassin: Number(basin),
      date_heure_prelevement: new Date(sampledAt).toISOString(),
      oxygene: Number(oxygenRate),
      temperature_air: Number(airTemperature),
      temperature_eau: Number(waterTemperature),
      ph,
      nitrate,
      nitrite,
      ammoniac: ammonia,
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

      <div className="environment-measurement-groups">
        <MeasurementCheckboxGroup label="pH" options={phOptions} selected={ph} onChange={setPh} />
        <MeasurementCheckboxGroup label="Taux de nitrate (mg/L)" options={nitrateOptions} selected={nitrate} onChange={setNitrate} />
        <MeasurementCheckboxGroup label="Taux de nitrite (mg/L)" options={nitriteOptions} selected={nitrite} onChange={setNitrite} />
        <MeasurementCheckboxGroup label="Ammoniac (mg/L)" options={ammoniaOptions} selected={ammonia} onChange={setAmmonia} />
      </div>

      {measurementError && <p className="form-error" role="alert">{measurementError}</p>}

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

function MeasurementCheckboxGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: number[];
  selected: number | null;
  onChange: (value: number | null) => void;
}) {
  function toggleOption(option: number) {
    onChange(selected === option ? null : option);
  }

  return (
    <fieldset className="environment-measurement-group" aria-required="true">
      <legend>{label}</legend>
      <div className="environment-checkbox-options">
        {options.map((option) => (
          <label className="environment-checkbox-option" key={option}>
            <span className="environment-color-placeholder" aria-hidden="true" />
            <input
              type="checkbox"
              checked={selected === option}
              disabled={selected !== null && selected !== option}
              onChange={() => toggleOption(option)}
            />
            <span>{option.toLocaleString("fr-FR")}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}