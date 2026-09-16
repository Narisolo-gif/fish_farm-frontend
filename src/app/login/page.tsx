export default function LoginPage() {
	return (
		<div className="login-page">
			<form className="login-card">
				<div className="logo-box">Fish Farm Anosy</div>
				<h1>Bon retour</h1>
				<p>Connectez-vous à votre espace de pilotage.</p>
				<label>
					Email
					<input type="email" placeholder="vous@fishfarm.local" />
				</label>
				<label>
					Mot de passe
					<input type="password" placeholder="••••••••" />
				</label>
				<button className="button button-primary" type="submit">
					Se connecter
				</button>
			</form>
		</div>
	);
}
