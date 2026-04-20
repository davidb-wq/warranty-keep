'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'

export function DeleteAccountButton({ deleteAction }: { deleteAction: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors border-t border-slate-100 dark:border-slate-700"
      >
        <Trash2 className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-medium">Supprimer mon compte</span>
      </button>
    )
  }

  return (
    <div className="px-4 py-3.5 border-t border-slate-100 dark:border-slate-700 space-y-3">
      <div className="flex gap-2 items-start">
        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 dark:text-slate-400">
          <strong>Action irréversible.</strong> Toutes vos garanties et photos seront définitivement supprimées.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
        >
          Annuler
        </button>
        <form
          action={async () => {
            setLoading(true)
            await deleteAction()
          }}
          className="flex-1"
        >
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            Confirmer
          </button>
        </form>
      </div>
    </div>
  )
}
