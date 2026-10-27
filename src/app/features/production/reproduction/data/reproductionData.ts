export const demoReproductionBasins = [
	"B-01",
	"B-02",
	"B-03",
	"B-04",
	"B-05",
	"B-06",
	"B-07",
	"B-08",
];

export type ReproductionSpecies = "Carpe" | "Tilapia";

export type ReproductionLot = {
	reference: string;
	basin: string;
	addedAt: string;
	species: ReproductionSpecies;
	maleQuantity: number;
	femaleQuantity: number;
	observation: string;
	status:string;
};

export type ReproductionPonte = {
	basin: string;
	reference: string;
	addedAt: string;
	eggQuantity: number;
	observation: string;
};

export function isReproductionPonte(value: unknown): value is ReproductionPonte {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	const ponte = value as Record<string, unknown>;
	return (
		typeof ponte.basin === "string" &&
		typeof ponte.reference === "string" &&
		typeof ponte.addedAt === "string" &&
		typeof ponte.eggQuantity === "number" &&
		typeof ponte.observation === "string"
	);
}
