import { demoTreatmentBasins } from "@/lib/data";

export function BassinSelector({
	value,
	onChange,
}: {
	value: string;
	onChange: (value: string) => void;
}) {
	return (
		<label>
			Bassin
			<select value={value} onChange={(event) => onChange(event.target.value)} required>
				<option value="" disabled>Sélectionner un bassin</option>
				{demoTreatmentBasins.map((basin) => (
					<option key={basin} value={basin}>{basin}</option>
				))}
			</select>
		</label>
	);
}