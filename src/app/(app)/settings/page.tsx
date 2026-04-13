import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LogOut, Bell, Info } from 'lucide-react'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
                  Un email est envoyé automatiquement selon l&apos;option choisie pour chaque garantie. Options roulantes (chaque mois, 3 mois, 1 an) : rappel envoyé à intervalle régulier depuis la date d&apos;achat. Options ponctuelles (3 ou 6 mois avant expiration) : un seul rappel envoyé à l&apos;approche de la date d&apos;expiration. Les rappels sont envoyés le 1er de chaque mois.
                </p>
              </div>
            </div>
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
