'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, ArrowRight, Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

const COOLDOWN_SECONDS = 60

function formatCooldown(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return m > 0 ? `${h}h ${m}min` : `${h}h`
  }
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return s > 0 ? `${m}min ${s}s` : `${m}min`
  }
  return `${seconds}s`
}

function translateError(message: string): string {
  if (message.includes('rate limit') || message.includes('too many') || message.includes('over_email_send_rate_limit')) {
    return 'Trop de tentatives envoyées. Veuillez réessayer dans 1 heure.'
  }
  if (message.includes('invalid') || message.includes('Invalid')) {
    return 'Adresse email invalide.'
  }
  return 'Une erreur est survenue. Veuillez réessayer.'
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('error') === 'auth_failed') {
      setError('Le lien de connexion est invalide ou a expiré. Veuillez en demander un nouveau.')
    }
  }, [searchParams])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (cooldown > 0) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    if (error) {
      setError(translateError(error.message))
      setLoading(false)
      // Démarrer un cooldown même en cas d'erreur de rate limit
      if (error.message.includes('rate limit') || error.message.includes('too many') || error.message.includes('over_email_send_rate_limit')) {
        setCooldown(3600) // Supabase bloque pendant ~1 heure
      }
      return
    }

    setSent(true)
    setCooldown(COOLDOWN_SECONDS)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 mb-4">
          <Mail className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Vérifiez votre courriel
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
          Un lien de connexion a été envoyé à{' '}
          <span className="font-medium text-slate-700 dark:text-slate-300">{email}</span>
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
          Cliquez sur le lien dans le courriel pour vous connecter automatiquement. Ce lien est valide pendant <span className="font-medium">1 heure</span>.
        </p>
        <p className="text-xs text-amber-500 dark:text-amber-400 mb-6">
          Si vous ne voyez pas le courriel, vérifiez votre dossier <span className="font-medium">indésirables / spam</span>.
        </p>

        {cooldown > 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Renvoyer dans {formatCooldown(cooldown)}
          </p>
        ) : (
          <button
            onClick={() => { setSent(false); setCooldown(0) }}
            className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
          >
            Renvoyer ou utiliser une autre adresse
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Connexion</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Entrez votre email pour recevoir un lien de connexion. Le compte sera créé automatiquement s&apos;il n&apos;existe pas encore.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Adresse email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent text-sm"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !email || cooldown > 0}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2.5 px-4 rounded-xl font-medium text-sm hover:bg-slate-700 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : cooldown > 0 ? (
            `Réessayer dans ${formatCooldown(cooldown)}`
          ) : (
            <>
              Envoyer le lien
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
