import { DataTable } from "@/components/DataTable";
import type {
	EnvironmentalBasin,
	EnvironmentalMeasurement,
} from "@/app/features/production/shared/environnement/types/environment.types";

function displayValue(value: number | string, unit = "") {
	return `${Number(value).toLocaleString("fr-FR")}${unit}`;
}

export function EnvironmentalParametersTable({
	measurements,
	basins,
}: {
	measurements: EnvironmentalMeasurement[];
	basins: EnvironmentalBasin[];
}) {
	const basinReferences = new Map(basins.map((basin) => [basin.id, basin.reference]));

	return (
		<DataTable
			className="ecloserie-table"
			headers={["Bassin", "Date et heure", "Temp. eau", "Temp. air", "Oxygène", "pH", "Nitrites", "Nitrates", "Ammoniac"]}
			rows={measurements.map((measurement) => [
				basinReferences.get(measurement.bassin) ?? `Bassin ${measurement.bassin}`,
				new Date(measurement.date_heure_prelevement).toLocaleString("fr-FR"),
				displayValue(measurement.temperature_eau, " °C"),
				displayValue(measurement.temperature_air, " °C"),
				displayValue(measurement.oxygene, " mg/L"),
				displayValue(measurement.ph),
				displayValue(measurement.nitrite, " mg/L"),
				displayValue(measurement.nitrate, " mg/L"),
				displayValue(measurement.ammoniac, " mg/L"),
			])}
		/>
	);
}