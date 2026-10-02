"use client";

import { type FormEvent, useState } from "react";
import { BassinSelector } from "@/app/features/production/shared/bassins/components/BassinSelector";
import type { EnvironmentalMeasurement } from "@/app/features/production/shared/environnement/types/environment.types";

const phOptions = [6.2, 6.8, 7.2, 7.6, 7.8, 8.1];
const nitrateOptions = [0, 10, 20, 25, 50, 100, 250];
const nitriteOptions = [0, 1, 5, 10];
const ammoniaOptions = [0, 0.5, 1, 3, 5, 10];

export function EnvironnementParametersForm({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (measurement: EnvironmentalMeasurement) => void;
}) {
  const [sampledAt, setSampledAt] = useState("");
  const [basin, setBasin] = useState("");
  const [oxygenRate, setOxygenRate] = useState("");
  const [airTemperature, setAirTemperature] = useState("");
  const [waterTemperature, setWaterTemperature] = useState("");
  const [ph, setPh] = useState<number[]>([]);
  const [nitrate, setNitrate] = useState<number[]>([]);
  const [nitrite, setNitrite] = useState<number[]>([]);
  const [ammonia, setAmmonia] = useState<number[]>([]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      sampledAt,
      basin,
      oxygenRate: Number(oxygenRate),
      airTemperature: Number(airTemperature),
      waterTemperature: Number(waterTemperature),
      ph,
      nitrate,
      nitrite,
      ammonia,
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
        <BassinSelector value={basin} onChange={setBasin} />
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

      <p className="helper-text">Les emplacements des codes couleur sont laissés vides, en attente de leur définition.</p>

      <div className="form-actions">
        <button className="button button-ghost" type="button" onClick={onCancel}>
          Annuler
        </button>
        <button className="button button-primary" type="submit">
          Enregistrer le prélèvement
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
  selected: number[];
  onChange: (values: number[]) => void;
}) {
  function toggleOption(option: number) {
    onChange(
      selected.includes(option)
        ? selected.filter((value) => value !== option)
        : [...selected, option],
    );
  }

  return (
    <fieldset className="environment-measurement-group">
      <legend>{label}</legend>
      <div className="environment-checkbox-options">
        {options.map((option) => (
          <label className="environment-checkbox-option" key={option}>
            <span className="environment-color-placeholder" aria-hidden="true" />
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => toggleOption(option)}
            />
            <span>{option.toLocaleString("fr-FR")}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}