import { Button } from "@/components/ui";
import { Breadcrumb, PageHeader } from "@/components/PageHeader";

export default async function BasinsPage({
	params,
}: {
	params: Promise<{ module: string }>;
}) {
	const { module } = await params;

	return (
		<div className="page">
			<Breadcrumb items={["Production", module, "Bassins"]} />
			<PageHeader
				title="Bassins"
				description="Configuration et suivi des bassins du module."
				action={<Button href="/basins/new">+ Ajouter un bassin</Button>}
			/>
			<div className="basin-list">
				<article className="basin-card">
					<div>
						<strong>Bassin B-01</strong>
						<span className="badge badge-blue">2 happas</span>
					</div>
					<p>
						Type bassin · Capacité max: 240 · Superficie: 120 m² · Profondeur: 1,4 m
					</p>
					<div className="happa-row">
						<span>↳ Happa H-01</span>
						<span>Capacité max: 120</span>
					</div>
					<div className="happa-row">
						<span>↳ Happa H-02</span>
						<span>Capacité max: 120</span>
					</div>
				</article>
				<article className="basin-card">
					<div>
						<strong>Bassin B-02</strong>
						<span className="badge">Aucun happa</span>
					</div>
					<p>
						Type bassin · Capacité max: 180 · Superficie: 90 m² · Profondeur: 1,2 m
					</p>
				</article>
			</div>
		</div>
	);
}
