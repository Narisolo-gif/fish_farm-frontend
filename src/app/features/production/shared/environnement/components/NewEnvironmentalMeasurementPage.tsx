"use client";

import { useRouter } from "next/navigation";
import { Breadcrumb, PageHeader } from "@/components/PageHeader";
import { EnvironmentalParametersSection } from "@/app/features/production/shared/environnement/components/EnvironmentalParametersSection";

export function NewEnvironmentalMeasurementPage() {
  const router = useRouter();

  return (
    <div className="page">
      <Breadcrumb items={["Production", "Paramètres environnementaux", "Nouveau prélèvement"]} />
      <PageHeader
        eyebrow="Production"
        title="Nouveau prélèvement environnemental"
        description="Saisissez les mesures relevées pour un bassin."
      />

      <EnvironmentalParametersSection initialFormOpen onCancel={() => router.back()} />
    </div>
  );
}