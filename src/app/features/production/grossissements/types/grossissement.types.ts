export type GrossissementFeature =
  | "mortalite"
  | "pesees"
  | "provende"
  | "environnement"
  | "dashboard"
  | "cloture";

export type GrossissementSection = Extract<
  GrossissementFeature,
  "mortalite" | "pesees" | "provende" | "environnement" | "dashboard"
>;