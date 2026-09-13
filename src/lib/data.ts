export type ModuleKey = "reproduction" | "ecloserie" | "traitement" | "stock" | "grossissement";

export const modules: { key: ModuleKey; label: string; icon: string; description: string }[] = [
  { key: "reproduction", label: "Reproduction", icon: "♡", description: "Suivi des géniteurs et pontes" },
  { key: "ecloserie", label: "Écloserie", icon: "◯", description: "Incubation et alevins" },
  { key: "traitement", label: "Traitement", icon: "✣", description: "Soins et interventions" },
  { key: "stock", label: "Stock", icon: "▣", description: "Inventaire et mouvements" },
  { key: "grossissement", label: "Grossissement", icon: "↟", description: "Lots, bassins et croissance" },
];

export const lots = [
  { name: "Bassin A — Lot 12", state: "Actif", count: "240 poissons", weight: "18,4 kg" },
  { name: "Bassin B — Lot 13", state: "Actif", count: "180 poissons", weight: "12,1 kg" },
  { name: "Bassin C — Lot 09", state: "Clôturé", count: "—", weight: "—" },
];

export const orders = [
  { reference: "CMD-2025-001", date: "12 juin 2025", supplier: "Aqua Nutrition", amount: "1 240 €", status: "En cours" },
  { reference: "CMD-2025-002", date: "08 juin 2025", supplier: "Pisciculture Pro", amount: "860 €", status: "Livrée" },
];

export const users = [
  { name: "Marie Rasoanaivo", email: "marie@fishfarm.local", role: "Administrateur", status: "Actif" },
  { name: "Paul Rakoto", email: "paul@fishfarm.local", role: "Responsable stock", status: "Actif" },
  { name: "Lina Andria", email: "lina@fishfarm.local", role: "Opérateur", status: "Désactivé" },
];
