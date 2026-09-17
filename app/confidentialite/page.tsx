import type { Metadata } from "next";
import { Contact, LegalPage } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Règles de confidentialité — Studio Voix",
  description: "Comment Studio Voix collecte, utilise et protège vos données et vos enregistrements.",
};

export default function ConfidentialitePage() {
  return (
    <LegalPage title="Règles de confidentialité">
      <p>
        {LEGAL.service} ({LEGAL.site}), édité par {LEGAL.editeur}, permet d&apos;enregistrer sa voix dans le navigateur, d&apos;en nettoyer le son,
        de la transcrire et de l&apos;éditer. Cette page explique quelles données nous traitons, pourquoi, avec qui nous les partageons et
        quels sont vos droits.
      </p>

      <h2>1. Données que nous collectons</h2>
      <ul>
        <li>
          <strong>Compte</strong> : votre adresse e-mail et, si vous utilisez « Continuer avec Google », votre nom et votre photo de profil
          Google. Nous ne recevons jamais votre mot de passe Google.
        </li>
        <li>
          <strong>Enregistrements audio</strong> : les fichiers que vous enregistrez ou importez, leurs versions nettoyées et les MP3 exportés.
        </li>
        <li>
          <strong>Transcriptions et modifications</strong> : le texte de vos enregistrements, le minutage de chaque mot et la liste des passages
          que vous coupez.
        </li>
        <li>
          <strong>Offre et paiements</strong> : l&apos;offre souscrite, sa date d&apos;expiration et la durée audio traitée chaque mois. Les
          paiements Mobile Money sont traités par l&apos;opérateur de paiement : nous ne stockons pas vos identifiants de paiement.
        </li>
        <li>
          <strong>Données techniques</strong> : cookies de session nécessaires à la connexion et journaux techniques de nos hébergeurs
          (adresse IP, navigateur, erreurs).
        </li>
      </ul>

      <h2>2. Utilisation de vos données</h2>
      <ul>
        <li>Vous connecter et sécuriser votre compte.</li>
        <li>Nettoyer le son, transcrire et assembler vos enregistrements, uniquement à votre demande.</li>
        <li>Appliquer les limites de votre offre (durée par enregistrement, minutes mensuelles).</li>
        <li>Vous contacter au sujet de votre compte ou d&apos;un problème de service.</li>
      </ul>
      <p>
        Nous ne vendons pas vos données. Nous n&apos;utilisons pas vos enregistrements pour de la publicité et ne les écoutons pas, sauf à
        votre demande explicite pour résoudre un problème.
      </p>

      <h2>3. Prestataires qui traitent vos données</h2>
      <p>Pour fournir le service, certaines données sont transmises à des prestataires techniques, qui ne les utilisent que pour notre compte :</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Prestataire</th>
              <th>Rôle</th>
              <th>Données concernées</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Supabase</td>
              <td>Comptes, base de données, stockage des fichiers</td>
              <td>Compte, audio, transcriptions, coupes</td>
            </tr>
            <tr>
              <td>Vercel</td>
              <td>Hébergement du site</td>
              <td>Données techniques de navigation</td>
            </tr>
            <tr>
              <td>ElevenLabs</td>
              <td>Transcription, isolation de la voix (offre Voix Studio)</td>
              <td>Audio envoyé pour traitement</td>
            </tr>
            <tr>
              <td>Auphonic</td>
              <td>Réduction du bruit (offres Gratuit et Standard)</td>
              <td>Audio envoyé pour traitement, supprimé après récupération</td>
            </tr>
            <tr>
              <td>Google</td>
              <td>Connexion « Continuer avec Google »</td>
              <td>E-mail, nom, photo de profil</td>
            </tr>
            <tr>
              <td>Opérateur Mobile Money</td>
              <td>Paiement des offres</td>
              <td>Données de transaction</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>Ces prestataires peuvent héberger les données hors de votre pays, notamment aux États-Unis et dans l&apos;Union européenne.</p>

      <h2>4. Utilisation des données Google</h2>
      <p>
        Lorsque vous vous connectez avec Google, {LEGAL.service} demande uniquement l&apos;accès à votre adresse e-mail et à votre profil de
        base. Ces informations servent exclusivement à créer et identifier votre compte. Nous n&apos;accédons à aucune autre donnée de votre
        compte Google (Gmail, Drive, contacts…). L&apos;utilisation des informations reçues des API Google respecte les{" "}
        <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">
          règles relatives aux données utilisateur des services d&apos;API Google
        </a>
        , y compris les exigences d&apos;utilisation limitée.
      </p>

      <h2>5. Durée de conservation</h2>
      <ul>
        <li>Enregistrements, transcriptions et exports : tant que le projet existe dans votre compte.</li>
        <li>Compte : jusqu&apos;à sa suppression. Les données associées sont alors effacées.</li>
        <li>Journaux techniques : selon les durées de conservation de nos hébergeurs.</li>
      </ul>

      <h2>6. Sécurité</h2>
      <p>
        Les fichiers audio sont stockés dans un espace privé : chaque utilisateur n&apos;a accès qu&apos;à ses propres fichiers, via des liens
        temporaires. Les échanges sont chiffrés (HTTPS). Les clés d&apos;accès aux services tiers restent sur nos serveurs.
      </p>

      <h2>7. Vos droits</h2>
      <p>
        Vous pouvez demander l&apos;accès à vos données, leur rectification, leur suppression ou leur export, et vous opposer à leur
        traitement. Pour cela, écrivez-nous à <Contact />. Nous répondons dans un délai d&apos;un mois. Vous pouvez aussi saisir
        l&apos;autorité de protection des données de votre pays.
      </p>

      <h2>8. Cookies</h2>
      <p>
        {LEGAL.service} utilise uniquement les cookies nécessaires à la connexion et au fonctionnement du service. Aucun cookie publicitaire
        ni de mesure d&apos;audience tiers n&apos;est utilisé.
      </p>

      <h2>9. Mineurs</h2>
      <p>Le service n&apos;est pas destiné aux enfants de moins de 13 ans.</p>

      <h2>10. Modifications</h2>
      <p>
        Nous pouvons mettre à jour ces règles. La date en haut de page indique la dernière version. En cas de changement important, nous vous
        préviendrons par e-mail ou sur le site.
      </p>
    </LegalPage>
  );
}
