import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LogOut, Bell, Info, Download, Shield } from 'lucide-react'
import Link from 'next/link'
import { InstallSettingsRow } from '@/app/components/ui/install-settings-row'
import { DeleteAccountButton } from '@/app/components/ui/delete-account-button'
import { ShareSection } from '@/app/components/ui/share-section'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

async function deleteAccount() {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Récupérer les IDs pour nettoyer le Storage
  const { data: warranties } = await supabase
    .from('warranties')
    .select('id')

  // Supprimer les photos du Storage
  if (warranties && warranties.length > 0) {
    const paths = warranties.map((w: { id: string }) => `${user.id}/${w.id}.webp`)
    await supabase.storage.from('warranty-images').remove(paths)
  }

  // Supprimer les garanties (RLS assure user_id = user)
  await supabase.from('warranties').delete().eq('user_id', user.id)

  // Supprimer le compte auth via service role
  const { createClient: createAdminClient } = await import('@supabase/supabase-js')
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  await admin.auth.admin.deleteUser(user.id)

  redirect('/login')
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: sentInvites }, { data: receivedShares }] = await Promise.all([
    supabase
      .from('shared_access')
      .select('id, invitee_email, status, created_at')
      .eq('owner_id', user!.id)
      .neq('status', 'revoked')
      .order('created_at', { ascending: false }),
    supabase
      .from('shared_access')
      .select('id, owner_email, accepted_at')
      .eq('invitee_id', user!.id)
      .eq('status', 'accepted'),
  ])

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Paramètres</h1>

      <div className="space-y-4">
        {/* Account */}
        <section>
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">
            Compte
          </h2>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">
                {user?.email}
              </p>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">Se déconnecter</span>
              </button>
            </form>
          </div>
        </section>

        {/* Install app */}
        <section>
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">
            Application
          </h2>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <InstallSettingsRow />
          </div>
        </section>

        {/* Reminders info */}
        <section>
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">
            Rappels
          </h2>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex gap-3">
              <Bell className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                  Rappels automatiques
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Un email est envoyé automatiquement selon l&apos;option choisie pour chaque garantie. Options roulantes (chaque mois, 3 mois, 1 an) : rappel envoyé le même jour que votre date d&apos;achat, à l&apos;intervalle choisi. Options ponctuelles (3 ou 6 mois avant expiration) : un seul rappel envoyé exactement 3 ou 6 mois avant la date d&apos;expiration.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Partage */}
        <ShareSection
          sentInvites={(sentInvites ?? []) as Array<{ id: string; invitee_email: string; status: 'pending' | 'accepted' | 'revoked'; created_at: string }>}
          receivedShares={(receivedShares ?? []) as Array<{ id: string; owner_email: string; accepted_at: string | null }>}
        />

        {/* Confidentialité */}
        <section>
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">
            Confidentialité
          </h2>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Export données */}
            <a
              href="/api/export"
              download
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700"
            >
              <Download className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Exporter mes données</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Télécharger toutes vos garanties en JSON</p>
              </div>
            </a>

            {/* Politique de confidentialité */}
            <Link
              href="/confidentialite"
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700"
            >
              <Shield className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Politique de confidentialité</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Loi 25 — vos droits et nos pratiques</p>
              </div>
            </Link>

            {/* Suppression compte */}
            <DeleteAccountButton deleteAction={deleteAccount} />
          </div>
        </section>

        {/* About */}
        <section>
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">
            À propos
          </h2>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                  ZenGarantie
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Version 1.0.0 — Vos garanties, toujours à portée de main.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
