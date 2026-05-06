import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, ShieldOff, LogIn } from 'lucide-react'

export default async function ShareAcceptPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return <InvalidPage />
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Read the invitation by token — pending_by_token policy allows this for any session
  const { data: record } = await supabase
    .from('shared_access')
    .select('id, owner_email, invitee_email, status, invitee_id')
    .eq('token', token)
    .maybeSingle()

  // Token not found, revoked, or no access
  if (!record) {
    return <InvalidPage />
  }

  // Already accepted — redirect directly
  if (record.status === 'accepted') {
    redirect('/warranties')
  }

  // Not logged in → show invitation info + login prompt
  if (!user) {
    const loginUrl = `/login?redirect=${encodeURIComponent(`/share/accept?token=${token}`)}`
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 max-w-sm w-full text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700 mb-4">
            <ShieldCheck className="w-7 h-7 text-slate-700 dark:text-slate-300" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Invitation reçue
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            <span className="font-medium text-slate-700 dark:text-slate-300">{record.owner_email}</span>{' '}
            vous invite à partager vos garanties sur ZenGarantie.
          </p>
          <Link
            href={loginUrl}
            className="flex items-center justify-center gap-2 w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2.5 px-4 rounded-xl font-medium text-sm hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Se connecter pour accepter
          </Link>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
            Pas encore de compte ? Créez-en un avec l&apos;email{' '}
            <span className="font-medium">{record.invitee_email}</span>.
          </p>
        </div>
      </div>
    )
  }

  // Logged in but wrong email
  if (user.email?.toLowerCase() !== record.invitee_email.toLowerCase()) {
    const maskedEmail = record.invitee_email.replace(/(.{2}).+(@.+)/, '$1***$2')
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 max-w-sm w-full text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900 mb-4">
            <ShieldOff className="w-7 h-7 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Mauvais compte
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Cette invitation était destinée à{' '}
            <span className="font-medium text-slate-700 dark:text-slate-300">{maskedEmail}</span>.
            Vous êtes connecté avec{' '}
            <span className="font-medium text-slate-700 dark:text-slate-300">{user.email}</span>.
          </p>
          <Link
            href="/warranties"
            className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
          >
            Retour à mes garanties
          </Link>
        </div>
      </div>
    )
  }

  // ✅ Logged in with matching email → auto-accept immediately
  const { error } = await supabase
    .from('shared_access')
    .update({
      status: 'accepted',
      invitee_id: user.id,
      accepted_at: new Date().toISOString(),
    })
    .eq('token', token)
    .eq('status', 'pending')

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 max-w-sm w-full text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900 mb-4">
            <ShieldOff className="w-7 h-7 text-red-500 dark:text-red-400" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Erreur lors de l&apos;acceptation
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Impossible d&apos;activer le partage. Contactez la personne qui vous a invité.
          </p>
          <Link href="/warranties" className="text-sm text-slate-500 underline">
            Continuer quand même
          </Link>
        </div>
      </div>
    )
  }

  // Success → redirect to warranties (will now show partner's warranties)
  redirect('/warranties')
}

function InvalidPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 max-w-sm w-full text-center shadow-sm">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900 mb-4">
          <ShieldOff className="w-7 h-7 text-red-500 dark:text-red-400" />
        </div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          Lien invalide
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Ce lien d&apos;invitation n&apos;est plus valide ou a déjà été utilisé.
        </p>
        <Link href="/login" className="text-sm text-slate-500 underline">
          Aller à la connexion
        </Link>
      </div>
    </div>
  )
}
