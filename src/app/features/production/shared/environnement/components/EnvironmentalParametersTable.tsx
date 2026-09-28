import { DataTable } from "@/components/DataTable";

const environmentalParameters = [
	{ name: "Température de l'eau", value: "— °C" },
	{ name: "Température de l'air", value: "— °C" },
	{ name: "Taux d'oxygène", value: "— mg/L" },
	{ name: "Taux de nitrites", value: "— mg/L" },
	{ name: "Taux de nitrates", value: "— mg/L" },
];

export function EnvironmentalParametersTable() {
	return (
		<DataTable
			className="ecloserie-table"
			headers={["Paramètre", "Valeur actuelle", "Statut"]}
			rows={environmentalParameters.map((parameter) => [
				parameter.name,
				parameter.value,
				<span className="badge" key={`${parameter.name}-status`}>Non renseigné</span>,
			])}
		/>
	);
}