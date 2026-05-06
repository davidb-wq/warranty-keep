'use client'

import { useState, useTransition } from 'react'
import { Users, Mail, Loader2, CheckCircle, Clock, Trash2, LogOut, Plus } from 'lucide-react'

interface SentInvite {
  id: string
  invitee_email: string
  status: 'pending' | 'accepted' | 'revoked'
  created_at: string
}

interface ReceivedShare {
  id: string
  owner_email: string
  accepted_at: string | null
}

interface ShareSectionProps {
  sentInvites: SentInvite[]
  receivedShares: ReceivedShare[]
  inviteAction: (email: string) => Promise<{ error?: string; success?: true }>
  removeAction: (id: string) => Promise<{ error?: string; success?: true }>
}

export function ShareSection({
  sentInvites,
  receivedShares,
  inviteAction,
  removeAction,
}: ShareSectionProps) {
  const [email, setEmail] = useState('')
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState('')

  const [invitePending, startInviteTransition] = useTransition()
  const [removePending, startRemoveTransition] = useTransition()

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')
    startInviteTransition(async () => {
      const result = await inviteAction(email.trim())
      if (result.error) {
        setFormError(result.error)
      } else {
        setFormSuccess(`Invitation envoyée à ${email.trim()} !`)
        setEmail('')
      }
    })
  }

  function handleRemove(id: string) {
    setRemovingId(id)
    setRemoveError('')
    startRemoveTransition(async () => {
      const result = await removeAction(id)
      if (result.error) {
        setRemoveError(result.error)
      }
      setRemovingId(null)
    })
  }

  const isRemoving = (id: string) => removePending && removingId === id

  return (
    <section>
      <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">
        Partage
      </h2>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">

        {/* Invite form */}
        <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex gap-2 items-center mb-3">
            <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              Inviter un membre
            </p>
          </div>
          <form onSubmit={handleInvite} className="flex gap-2">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setFormError(''); setFormSuccess('') }}
                placeholder="email@exemple.com"
                required
                disabled={invitePending}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent text-sm disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={invitePending || !email}
              className="flex items-center gap-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-700 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              {invitePending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Inviter
            </button>
          </form>
          {formError && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{formError}</p>}
          {formSuccess && <p className="text-xs text-green-600 dark:text-green-400 mt-2">{formSuccess}</p>}
        </div>

        {/* Invitations envoyées */}
        {sentInvites.length > 0 && (
          <div className={receivedShares.length > 0 ? 'border-b border-slate-100 dark:border-slate-700' : ''}>
            <p className="px-4 pt-3 pb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              Invitations envoyées
            </p>
            {sentInvites.map(invite => (
              <div
                key={invite.id}
                className="flex items-center gap-3 px-4 py-3 border-t border-slate-50 dark:border-slate-700/50 first:border-t-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {invite.invitee_email}
                  </p>
                </div>
                <StatusBadge status={invite.status} />
                <button
                  onClick={() => handleRemove(invite.id)}
                  disabled={isRemoving(invite.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                  title="Révoquer"
                >
                  {isRemoving(invite.id)
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Partagé avec moi */}
        {receivedShares.length > 0 && (
          <div>
            <p className="px-4 pt-3 pb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              Partagé avec moi
            </p>
            {receivedShares.map(share => (
              <div
                key={share.id}
                className="flex items-center gap-3 px-4 py-3 border-t border-slate-50 dark:border-slate-700/50 first:border-t-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {share.owner_email}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Accès en lecture</p>
                </div>
                <button
                  onClick={() => handleRemove(share.id)}
                  disabled={isRemoving(share.id)}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50 rounded-lg hover:bg-red-50 dark:hover:bg-red-950"
                  title="Quitter ce partage"
                >
                  {isRemoving(share.id)
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <LogOut className="w-3.5 h-3.5" />}
                  Quitter
                </button>
              </div>
            ))}
          </div>
        )}

        {removeError && (
          <p className="px-4 py-2 text-xs text-red-600 dark:text-red-400 border-t border-slate-100 dark:border-slate-700">
            {removeError}
          </p>
        )}

        {/* Empty state */}
        {sentInvites.length === 0 && receivedShares.length === 0 && (
          <div className="px-4 py-4 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Invite un ou des membres de ta famille afin que vous puissiez partager vos garanties.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

function StatusBadge({ status }: { status: 'pending' | 'accepted' | 'revoked' }) {
  if (status === 'accepted') {
    return (
      <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium flex-shrink-0">
        <CheckCircle className="w-3.5 h-3.5" />
        Acceptée
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium flex-shrink-0">
      <Clock className="w-3.5 h-3.5" />
      En attente
    </span>
  )
}
