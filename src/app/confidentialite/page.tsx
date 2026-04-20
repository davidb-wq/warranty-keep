import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — ZenGarantie',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
      <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed space-y-2">
        {children}
      </div>
    </section>
  )
}

function Table({ rows }: { rows: [string, string][] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 mt-3">
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([label, value], i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-slate-50 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-800'}>
              <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300 w-2/5">{label}</td>
              <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-10">

        {/* Navigation retour */}
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          ← Retour à la connexion
        </Link>

        {/* En-tête */}
        <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
          <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-medium px-3 py-1 rounded-full mb-4">
            <span>✓</span> Conforme à la Loi 25 du Québec
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Politique de confidentialité
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            En vigueur depuis le 20 avril 2026
          </p>
        </div>

        {/* 1. Responsable du traitement */}
        <Section title="1. Responsable du traitement">
          <p>
            ZenGarantie est exploité par <strong className="text-slate-800 dark:text-slate-200">David Blouin</strong>,
            résidant au Québec, Canada. Pour toute question relative à la confidentialité de vos
            renseignements personnels, vous pouvez nous contacter à :
          </p>
          <p>
            <a
              href="mailto:davidblouin03@gmail.com"
              className="text-slate-900 dark:text-white font-medium underline hover:opacity-70 transition-opacity"
            >
              davidblouin03@gmail.com
            </a>
          </p>
        </Section>

        {/* 2. Données collectées et finalités */}
        <Section title="2. Renseignements collectés et finalités">
          <p>
            Nous collectons uniquement les renseignements nécessaires au fonctionnement du service :
          </p>
          <Table rows={[
            ['Adresse email', 'Authentification et envoi des rappels de garantie par courriel'],
            ['Garanties (titre, date, durée, emplacement, notes)', 'Gestion personnelle de vos garanties'],
            ['Photos de factures ou preuves d\'achat', 'Archivage numérique de vos preuves d\'achat'],
            ['Témoins de session (cookies Supabase)', 'Maintien de votre session de connexion (durée : 1 an)'],
          ]} />
          <p className="mt-3">
            Nous ne collectons aucune donnée à des fins publicitaires, analytiques ou de profilage.
          </p>
        </Section>

        {/* 3. Base légale */}
        <Section title="3. Base légale du traitement">
          <p>
            Le traitement de vos renseignements personnels repose sur votre <strong className="text-slate-800 dark:text-slate-200">consentement
            implicite</strong> lors de la création d&apos;un compte, ainsi que sur notre <strong className="text-slate-800 dark:text-slate-200">intérêt
            légitime</strong> à vous fournir le service demandé, conformément à la{' '}
            <em>Loi modernisant des dispositions législatives en matière de protection des renseignements personnels</em>{' '}
            (Loi 25, L.Q. 2021, c. 25).
          </p>
          <p>
            Vous pouvez retirer votre consentement en tout temps en supprimant votre compte depuis
            la section <strong className="text-slate-800 dark:text-slate-200">Paramètres → Supprimer mon compte</strong>.
          </p>
        </Section>

        {/* 4. Tiers */}
        <Section title="4. Tiers et sous-traitants">
          <p>
            Vos données sont traitées par les sous-traitants suivants, dans le seul but de vous
            fournir le service :
          </p>
          <Table rows={[
            ['Supabase (supabase.com)', 'Base de données, authentification et stockage des photos — États-Unis / Union européenne'],
            ['Brevo (brevo.com)', 'Envoi des courriels d\'authentification et des rappels — France / Union européenne'],
            ['Vercel (vercel.com)', 'Hébergement de l\'application et exécution des tâches planifiées — États-Unis / Union européenne'],
          ]} />
          <p className="mt-3">
            Ces fournisseurs agissent exclusivement selon nos instructions et sont soumis à leurs
            propres politiques de confidentialité. Aucune donnée n&apos;est vendue ni partagée à des tiers
            à des fins commerciales.
          </p>
        </Section>

        {/* 5. Conservation */}
        <Section title="5. Conservation des données">
          <p>
            Vos renseignements personnels sont conservés tant que votre compte est actif.
          </p>
          <p>
            Si vous supprimez votre compte, toutes vos données (adresse email, garanties,
            photos) sont <strong className="text-slate-800 dark:text-slate-200">supprimées immédiatement et définitivement</strong> de
            nos systèmes. Les copies de sauvegarde automatiques conservées par Supabase peuvent
            subsister jusqu&apos;à 30 jours conformément à leurs politiques internes.
          </p>
        </Section>

        {/* 6. Droits */}
        <Section title="6. Vos droits (Loi 25)">
          <p>
            En vertu de la Loi 25, vous disposez des droits suivants concernant vos renseignements personnels :
          </p>
          <div className="space-y-2 mt-2">
            {[
              { right: 'Droit d\'accès', desc: 'Obtenir une copie des renseignements que nous détenons vous concernant.' },
              { right: 'Droit de rectification', desc: 'Corriger des renseignements inexacts directement dans l\'application (modification de garanties).' },
              { right: 'Droit à la suppression', desc: 'Effacer votre compte et toutes vos données via Paramètres → Supprimer mon compte.' },
              { right: 'Droit à la portabilité', desc: 'Obtenir vos données dans un format structuré via Paramètres → Exporter mes données (fichier JSON).' },
              { right: 'Droit de retrait du consentement', desc: 'Retirer votre consentement en tout temps en supprimant votre compte.' },
            ].map(({ right, desc }) => (
              <div key={right} className="flex gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3">
                <div className="text-emerald-600 dark:text-emerald-400 font-medium text-xs mt-0.5 w-32 flex-shrink-0">{right}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">{desc}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* 7. Exercer ses droits */}
        <Section title="7. Comment exercer vos droits">
          <p>
            Les droits de rectification, de suppression et de portabilité sont accessibles directement
            depuis la section <strong className="text-slate-800 dark:text-slate-200">Paramètres</strong> de l&apos;application.
          </p>
          <p>
            Pour exercer votre droit d&apos;accès ou pour toute demande non couverte par les fonctions
            intégrées, contactez-nous par courriel à{' '}
            <a
              href="mailto:davidblouin03@gmail.com"
              className="text-slate-900 dark:text-white font-medium underline hover:opacity-70 transition-opacity"
            >
              davidblouin03@gmail.com
            </a>
            . Nous répondrons dans un délai de <strong className="text-slate-800 dark:text-slate-200">30 jours</strong>.
          </p>
        </Section>

        {/* 8. Cookies */}
        <Section title="8. Témoins de connexion (cookies)">
          <p>
            ZenGarantie utilise uniquement des <strong className="text-slate-800 dark:text-slate-200">témoins fonctionnels</strong> nécessaires
            à l&apos;authentification (cookies de session Supabase, durée maximale : 1 an).
          </p>
          <p>
            Nous n&apos;utilisons <strong className="text-slate-800 dark:text-slate-200">aucun</strong> cookie publicitaire, analytique
            ou de traçage tiers. Ces témoins fonctionnels sont indispensables au service ; les
            refuser empêche l&apos;accès à l&apos;application.
          </p>
        </Section>

        {/* 9. Sécurité */}
        <Section title="9. Sécurité des données">
          <p>
            Vos données sont protégées par les mesures suivantes :
          </p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Transmission chiffrée via HTTPS (TLS)</li>
            <li>Authentification par code à usage unique (OTP) ou OAuth PKCE (Google, Microsoft)</li>
            <li>Politiques de sécurité au niveau des lignes (Row-Level Security) dans Supabase — vous n&apos;accédez qu&apos;à vos propres données</li>
            <li>Aucune clé secrète exposée côté client</li>
            <li>Accès au stockage des photos restreint à votre dossier personnel</li>
          </ul>
        </Section>

        {/* 10. Modifications */}
        <Section title="10. Modifications à cette politique">
          <p>
            En cas de modification importante à cette politique, un avis vous sera présenté lors
            de votre prochaine connexion. La date de dernière mise à jour est indiquée en haut
            de cette page.
          </p>
          <p>
            L&apos;utilisation continue de l&apos;application après notification de modifications constitue
            votre acceptation de la politique révisée.
          </p>
        </Section>

        {/* Pied de page */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-6 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            ZenGarantie — Québec, Canada ·{' '}
            <a href="mailto:davidblouin03@gmail.com" className="underline hover:text-slate-600 dark:hover:text-slate-300">
              davidblouin03@gmail.com
            </a>
          </p>
          <Link
            href="/login"
            className="inline-block mt-4 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline transition-colors"
          >
            Retour à la connexion
          </Link>
        </div>

      </div>
    </div>
  )
}
