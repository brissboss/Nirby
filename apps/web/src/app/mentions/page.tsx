import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mentions légales | Nirby",
  description: "Mentions légales du site Nirby (contenu d'exemple)",
};

export default function MentionsPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <p className="text-muted-foreground mb-8 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
          <strong className="text-foreground">Contenu fictif</strong> — conformément à l’article 6
          de la loi n° 2004-575 du 21 juin 2004, les mentions ci-dessous sont des{" "}
          <strong>exemples</strong> pour le cadre du projet. À substituer par des informations
          exactes avant diffusion publique.
        </p>

        <header className="mb-10">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Mentions légales</h1>
          <p className="text-muted-foreground mt-2 text-sm">Dernière mise à jour : 29 mars 2026</p>
        </header>

        <article className="space-y-8 text-sm leading-relaxed sm:text-base">
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">1. Éditeur du site</h2>
            <p>
              <strong>Société Exemple SARL</strong>
              <br />
              Capital social : 10 000 € (fictif)
              <br />
              RCS Paris : 000 000 000 (fictif)
              <br />
              Siège : 12 rue du Parchemin, 75000 Paris, France
              <br />
              Représentant légal : <strong>Jean Exemple</strong> (fictif)
              <br />
              Contact :{" "}
              <a
                className="text-primary underline underline-offset-4 hover:no-underline"
                href="mailto:contact-exemple@nirby.dev"
              >
                contact-exemple@nirby.dev
              </a>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">2. Directeur de la publication</h2>
            <p>
              <strong>Jean Exemple</strong>, en qualité de gérant fictif de Société Exemple SARL.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">3. Hébergement</h2>
            <p>
              <strong>Hébergeur Exemple SAS</strong>
              <br />
              Adresse : 8 avenue du Datacenter, 69000 Lyon, France (fictif)
              <br />
              Site web :{" "}
              <span className="text-muted-foreground">https://hebergeur-exemple.fr (fictif)</span>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">
              4. Propriété intellectuelle (rappel)
            </h2>
            <p>
              L’ensemble du site et de ses éléments (structure, textes, logos de démonstration) sont
              la propriété de l’éditeur fictif ou de ses partenaires, sauf mention contraire. Toute
              reproduction non autorisée est interdite sous peine de poursuites (formulation type —
              adaptée au statut réel du projet).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">5. Données personnelles</h2>
            <p>
              Le traitement des données à caractère personnel est décrit dans la{" "}
              <Link
                className="text-primary underline underline-offset-4 hover:no-underline"
                href="/privacy"
              >
                politique de confidentialité
              </Link>
              .
            </p>
          </section>
        </article>

        <footer className="text-muted-foreground mt-12 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-8 text-sm">
          <Link className="text-primary hover:underline" href="/">
            Accueil
          </Link>
          <Link className="text-primary hover:underline" href="/privacy">
            Politique de confidentialité
          </Link>
        </footer>
      </div>
    </div>
  );
}
