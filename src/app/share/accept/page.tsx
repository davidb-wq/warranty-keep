import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, ShieldOff, LogIn } from 'lucide-react'

async function acceptInvitation(token: string) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('shared_access')
    .update({
      status: 'accepted',
      invitee_id: user.id,
      accepted_at: new Date().toISOString(),
    })
    .eq('token', token)
    .eq('status', 'pending')
    .eq('invitee_email', user.email!)

  redirect('/warranties')
}

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

  // Lire le record par token (policy pending_by_token permet sans auth)
  const { data: record } = await supabase
    .from('shared_access')
    .select('id, owner_email, invitee_email, status')
    .eq('token', token)
    .eq('status', 'pending')
    .single()

  if (!record) {
    return <InvalidPage />
  }

  const { data: { user } } = await supabase.auth.getUser()

  // Flux C — non connecté
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
            vous invite à consulter ses garanties sur ZenGarantie.
          </p>
          <Link
            href={loginUrl}
            className="flex items-center justify-center gap-2 w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2.5 px-4 rounded-xl font-medium text-sm hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Se connecter pour accepter
          </Link>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
            Pas encore de compte ? Créez-en un après avoir cliqué sur le bouton.
          </p>
        </div>
      </div>
    )
  }

  // Flux B — connecté mais mauvais email
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
            Cette invitation était destinée à <span className="font-medium text-slate-700 dark:text-slate-300">{maskedEmail}</span>.
            Vous êtes connecté avec <span className="font-medium text-slate-700 dark:text-slate-300">{user.email}</span>.
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

  // Flux A — connecté, bon email → accepter directement
  const acceptAction = acceptInvitation.bind(null, token)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 max-w-sm w-full text-center shadow-sm">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-900 mb-4">
          <ShieldCheck className="w-7 h-7 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          Invitation reçue
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          <span className="font-medium text-slate-700 dark:text-slate-300">{record.owner_email}</span>{' '}
          vous invite à consulter ses garanties en lecture seule.
        </p>
        <form action={acceptAction}>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2.5 px-4 rounded-xl font-medium text-sm hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            Accepter l&apos;invitation
          </button>
        </form>
        <Link
          href="/warranties"
          className="block text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mt-4"
        >
          Refuser
        </Link>
      </div>
    </div>
  )
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
        <Link
          href="/login"
          className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
        >
          Aller à la connexion
        </Link>
      </div>
    </div>
  )
}
