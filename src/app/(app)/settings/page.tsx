import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { LogOut, Bell, Info, Download, Shield, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { InstallSettingsRow } from '@/app/components/ui/install-settings-row'
import { DeleteAccountButton } from '@/app/components/ui/delete-account-button'
import { ShareSection } from '@/app/components/ui/share-section'
import { render } from '@react-email/render'
import { ShareInviteEmail } from '@/../emails/share-invite'

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

  const { data: warranties } = await supabase.from('warranties').select('id')
  if (warranties && warranties.length > 0) {
    const paths = warranties.map((w: { id: string }) => `${user.id}/${w.id}.webp`)
    await supabase.storage.from('warranty-images').remove(paths)
  }
  await supabase.from('warranties').delete().eq('user_id', user.id)

  const { createClient: createAdminClient } = await import('@supabase/supabase-js')
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  await admin.auth.admin.deleteUser(user.id)
  redirect('/login')
}

async function inviteUser(email: string) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const inviteeEmail = email.trim().toLowerCase()
  if (!inviteeEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteeEmail)) {
    return { error: 'Adresse email invalide.' }
  }
  if (inviteeEmail === user.email?.toLowerCase()) {
    return { error: 'Vous ne pouvez pas vous inviter vous-même.' }
  }

  const { data: record, error: insertError } = await supabase
    .from('shared_access')
    .insert({ owner_id: user.id, owner_email: user.email!, invitee_email: inviteeEmail })
    .select('token')
    .single()

  if (insertError) {
    if (insertError.code === '23505') return { error: 'Une invitation a déjà été envoyée à cette adresse.' }
    return { error: insertError.message }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://zen-garantie.vercel.app'
  const acceptUrl = `${appUrl}/share/accept?token=${record.token}`
  const html = await render(ShareInviteEmail({ ownerEmail: user.email!, acceptUrl }))

  const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: { name: 'ZenGarantie', email: 'davidblouin03@gmail.com' },
      to: [{ email: inviteeEmail }],
      subject: `${user.email} vous invite sur ZenGarantie`,
      htmlContent: html,
    }),
  })

  if (!brevoRes.ok) return { error: "Erreur lors de l'envoi de l'email." }

  revalidatePath('/settings')
  return { success: true as const }
}

async function removeShare(id: string) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const { data: record } = await supabase
    .from('shared_access')
    .select('id, owner_id, invitee_id')
    .eq('id', id)
    .single()

  if (!record) return { error: 'Introuvable' }
  if (record.owner_id !== user.id && record.invitee_id !== user.id) {
    return { error: 'Accès refusé' }
  }

  const { error } = await supabase
    .from('shared_access')
    .update({ status: 'revoked' })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/settings')
  return { success: true as const }
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
              <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">{user?.email}</p>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
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
          inviteAction={inviteUser}
          removeAction={removeShare}
        />

        {/* Confidentialité */}
        <section>
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">
            Confidentialité
          </h2>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
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
            <Link
              href="/confidentialite"
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Shield className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Politique de confidentialité</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Loi 25 — vos droits et nos pratiques</p>
              </div>
            </Link>
          </div>
        </section>

        {/* Zone dangereuse */}
        <section>
          <h2 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Zone dangereuse
          </h2>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-red-200 dark:border-red-900 overflow-hidden">
            <div className="px-4 pt-3.5 pb-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                La suppression de votre compte est <strong className="text-red-600 dark:text-red-400">permanente et irréversible</strong>. Toutes vos garanties et photos seront effacées.
              </p>
            </div>
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
                <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">ZenGarantie</p>
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
