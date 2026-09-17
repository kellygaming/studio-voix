import type { Metadata } from "next";
import Link from "next/link";
import { Contact, LegalPage } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Conditions d'utilisation — Studio Voix",
  description: "Les règles d'utilisation du service Studio Voix.",
};

export default function ConditionsPage() {
  return (
    <LegalPage title="Conditions d'utilisation">
      <p>
        Les présentes conditions encadrent l&apos;utilisation de {LEGAL.service} ({LEGAL.site}), service édité par {LEGAL.editeur}. En créant
        un compte ou en utilisant le service, vous les acceptez.
      </p>

      <h2>1. Le service</h2>
      <p>
        {LEGAL.service} permet d&apos;enregistrer sa voix depuis un navigateur, de réduire le bruit, de transcrire l&apos;audio en français,
        de le modifier à partir du texte et de l&apos;exporter en MP3. Le traitement est automatisé : la qualité du résultat dépend de
        l&apos;enregistrement d&apos;origine, et les transcriptions peuvent contenir des erreurs.
      </p>

      <h2>2. Compte</h2>
      <ul>
        <li>Vous vous connectez par lien envoyé par e-mail ou avec votre compte Google.</li>
        <li>Vous êtes responsable de l&apos;accès à votre adresse e-mail et de l&apos;activité de votre compte.</li>
        <li>Vous devez avoir au moins 13 ans, et l&apos;accord d&apos;un parent si vous êtes mineur dans votre pays.</li>
      </ul>

      <h2>3. Offres, limites et paiement</h2>
      <ul>
        <li>
          <strong>Gratuit</strong> : enregistrements limités à 3 minutes.
        </li>
        <li>
          <strong>Standard</strong> et <strong>Voix Studio</strong> : offres payantes, avec des durées d&apos;enregistrement et un volume
          mensuel de traitement plus élevés. Les prix et limites en vigueur sont affichés sur le site au moment de la souscription.
        </li>
        <li>Le paiement se fait par Mobile Money. L&apos;offre est active pour la période payée, puis repasse en Gratuit sans renouvellement.</li>
        <li>
          Les limites de durée et de volume s&apos;appliquent automatiquement. Un traitement déjà lancé et réussi est décompté de votre
          volume mensuel.
        </li>
        <li>Sauf obligation légale contraire, une période entamée n&apos;est pas remboursée. En cas de panne de notre fait, contactez-nous.</li>
      </ul>

      <h2>4. Vos contenus</h2>
      <p>
        Vous restez propriétaire de vos enregistrements, transcriptions et exports. Vous nous autorisez uniquement à les stocker et à les
        traiter (y compris par nos prestataires techniques) pour vous fournir le service. Le fichier d&apos;origine n&apos;est jamais modifié : les
        coupes sont appliquées à l&apos;export.
      </p>
      <p>Vous vous engagez à n&apos;utiliser que des contenus que vous avez le droit d&apos;enregistrer et de diffuser. En particulier, vous ne devez pas :</p>
      <ul>
        <li>enregistrer une personne sans son consentement lorsque la loi l&apos;exige ;</li>
        <li>diffuser des contenus illicites, haineux, diffamatoires ou portant atteinte aux droits d&apos;autrui ;</li>
        <li>utiliser le service pour usurper la voix ou l&apos;identité d&apos;une autre personne ;</li>
        <li>contourner les limites des offres, surcharger ou tenter d&apos;attaquer le service.</li>
      </ul>

      <h2>5. Disponibilité</h2>
      <p>
        Nous faisons notre possible pour que le service soit disponible, sans pouvoir le garantir en permanence. Le traitement dépend de
        prestataires tiers et peut être ralenti ou interrompu. Conservez une copie de vos fichiers importants.
      </p>

      <h2>6. Responsabilité</h2>
      <p>
        Le service est fourni « en l&apos;état ». Dans la limite permise par la loi, {LEGAL.editeur} n&apos;est pas responsable des pertes de
        données, des erreurs de transcription ou des dommages indirects liés à l&apos;utilisation du service. Vous êtes seul responsable des
        contenus que vous publiez.
      </p>

      <h2>7. Suspension et résiliation</h2>
      <p>
        Vous pouvez cesser d&apos;utiliser le service et demander la suppression de votre compte à tout moment. Nous pouvons suspendre ou
        fermer un compte qui ne respecte pas ces conditions, après vous en avoir informé sauf urgence ou obligation légale.
      </p>

      <h2>8. Données personnelles</h2>
      <p>
        Le traitement de vos données est décrit dans nos <Link href="/confidentialite">Règles de confidentialité</Link>.
      </p>

      <h2>9. Modifications</h2>
      <p>
        Nous pouvons faire évoluer ces conditions. La version en vigueur est celle publiée sur cette page. En cas de changement important,
        vous serez prévenu avant son application.
      </p>

      <h2>10. Contact et droit applicable</h2>
      <p>
        Pour toute question : <Contact />. Les présentes conditions sont soumises au droit du pays du siège de {LEGAL.editeur}. En cas de
        litige, une solution amiable sera recherchée avant toute action.
      </p>
    </LegalPage>
  );
}
