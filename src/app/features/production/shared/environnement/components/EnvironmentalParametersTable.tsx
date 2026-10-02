import { DataTable } from "@/components/DataTable";
import type { EnvironmentalMeasurement } from "@/app/features/production/shared/environnement/types/environment.types";

function displayValues(values: number[] | undefined) {
	return values?.length ? values.map((value) => value.toLocaleString("fr-FR")).join(", ") : "—";
}

export function EnvironmentalParametersTable({
	measurement,
}: {
	measurement?: EnvironmentalMeasurement | null;
}) {
	const environmentalParameters = [
		{ name: "Température de l'eau", value: measurement ? `${measurement.waterTemperature.toLocaleString("fr-FR")} °C` : "— °C" },
		{ name: "Température de l'air", value: measurement ? `${measurement.airTemperature.toLocaleString("fr-FR")} °C` : "— °C" },
		{ name: "Taux d'oxygène", value: measurement ? `${measurement.oxygenRate.toLocaleString("fr-FR")} mg/L` : "— mg/L" },
		{ name: "pH", value: displayValues(measurement?.ph) },
		{ name: "Taux de nitrites", value: displayValues(measurement?.nitrite) },
		{ name: "Taux de nitrates", value: displayValues(measurement?.nitrate) },
		{ name: "Ammoniac", value: displayValues(measurement?.ammonia) },
	];

	return (
		<DataTable
			className="ecloserie-table"
			headers={["Paramètre", "Valeur actuelle", "Statut"]}
			rows={environmentalParameters.map((parameter) => [
				parameter.name,
				parameter.value,
				<span className={`badge${measurement ? " badge-green" : ""}`} key={`${parameter.name}-status`}>
					{measurement ? "Enregistré localement" : "Non renseigné"}
				</span>,
			])}
		/>
	);
}