"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumb, PageHeader } from "@/components/PageHeader";
import { EnvironnementParametersForm } from "@/app/features/production/shared/environnement/components/EnvironnementParametersForm";
import type { EnvironmentalMeasurement } from "@/app/features/production/shared/environnement/types/environment.types";

export function NewEnvironmentalMeasurementPage() {
  const router = useRouter();
  const [measurement, setMeasurement] = useState<EnvironmentalMeasurement | null>(null);

  return (
    <div className="page">
      <Breadcrumb items={["Production", "Paramètres environnementaux", "Nouveau prélèvement"]} />
      <PageHeader
        eyebrow="Production"
        title="Nouveau prélèvement environnemental"
        description="Saisissez les mesures relevées pour un bassin."
      />

      {measurement && (
        <p className="form-success" role="status">
          Prélèvement enregistré localement pour {measurement.basin} le {new Date(measurement.sampledAt).toLocaleString("fr-FR")}.
          Il ne sera pas conservé après rechargement.
        </p>
      )}

      <EnvironnementParametersForm
        onCancel={() => router.back()}
        onSubmit={setMeasurement}
      />
    </div>
  );
}