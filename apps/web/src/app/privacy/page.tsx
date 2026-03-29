import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité | Nirby",
  description: "Politique de confidentialité du service Nirby (contenu d'exemple)",
};

export default function PrivacyPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <p className="text-muted-foreground mb-8 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
          <strong className="text-foreground">Contenu fictif</strong> — texte d’illustration pour le
          projet Nirby. À remplacer par une politique conforme et validée avant toute mise en ligne
          réelle.
        </p>

        <header className="mb-10">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Politique de confidentialité
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">Dernière mise à jour : 29 mars 2026</p>
        </header>

        <article className="space-y-8 text-sm leading-relaxed sm:text-base">
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">1. Responsable du traitement</h2>
            <p>
              <strong>Société Exemple SARL</strong>, projet de démonstration « Nirby », siège social
              fictif : 12 rue du Parchemin, 75000 Paris, France.
              <br />
              Contact données personnelles :{" "}
              <a
                className="text-primary underline underline-offset-4 hover:no-underline"
                href="mailto:privacy-exemple@nirby.dev"
              >
                privacy-exemple@nirby.dev
              </a>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">2. Données collectées</h2>
            <p>
              Données de compte (identifiant, adresse e-mail, mot de passe haché, profil), contenus
              que vous créez (listes, lieux, médias éventuels), données techniques nécessaires au
              service (sessions, journaux limités), et interactions avec des prestataires tiers
              fictifs (envoi d’e-mails, cartographie).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">3. Finalités</h2>
            <p>
              Fourniture du service Nirby, authentification, sécurité, support, amélioration
              qualitative du produit dans le cadre de ce projet pédagogique.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">4. Base légale</h2>
            <p>
              Exécution des mesures précontractuelles et du contrat utilisateur ; intérêt légitime
              pour la sécurité et la prévention des abus, dans le respect des principes de
              proportionnalité (formulation générique — à affiner selon le traitement réel).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">5. Durées de conservation</h2>
            <p>
              Données de compte conservées jusqu’à suppression du compte. Jetons de vérification ou
              de réinitialisation : quelques heures à vingt-quatre heures selon le cas. Autres
              délais décrits dans la documentation technique du projet.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">6. Sous-traitants (exemple)</h2>
            <p>
              Hébergeur fictif « CloudExemple », prestataire d’e-mails « MailExemple », stockage
              d’objets « BucketExemple », API cartographique « MapsExemple » — noms et rôles à
              aligner sur l’infrastructure réelle.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">7. Vos droits</h2>
            <p>
              Accès, rectification, effacement, limitation, opposition dans les cas prévus par le
              RGPD, et réclamation auprès de la CNIL (
              <a
                className="text-primary underline underline-offset-4 hover:no-underline"
                href="https://www.cnil.fr"
                rel="noopener noreferrer"
                target="_blank"
              >
                cnil.fr
              </a>
              ). Pour exercer vos droits : contact indiqué en section 1.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">8. Sécurité</h2>
            <p>
              Mesures techniques décrites dans le mémoire du projet (authentification, validation
              des entrées, bonnes pratiques de développement). Détail : document « Spécifications
              techniques — sécurité ».
            </p>
          </section>
        </article>

        <footer className="text-muted-foreground mt-12 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-8 text-sm">
          <Link className="text-primary hover:underline" href="/">
            Accueil
          </Link>
          <Link className="text-primary hover:underline" href="/mentions">
            Mentions légales
          </Link>
        </footer>
      </div>
    </div>
  );
}
