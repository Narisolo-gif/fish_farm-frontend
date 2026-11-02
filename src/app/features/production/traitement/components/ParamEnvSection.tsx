"use client";

import { EnvironmentalParametersSection } from "@/app/features/production/shared/environnement/components/EnvironmentalParametersSection";
import type { EnvironmentalBasin } from "@/app/features/production/shared/environnement/types/environment.types";

export function ParamEnvSection({
	basinCategory = "TRAITEMENT",
}: {
	basinCategory?: EnvironmentalBasin["categorie"];
}) {
	return (
		<EnvironmentalParametersSection basinCategory={basinCategory} />
	);
}
