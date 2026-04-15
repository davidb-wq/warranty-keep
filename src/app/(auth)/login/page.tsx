'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, ArrowRight, Loader2, KeyRound } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'

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

function translateSendError(message: string): string {
  if (message.includes('rate limit') || message.includes('too many') || message.includes('over_email_send_rate_limit')) {
    return 'Trop de tentatives. Veuillez réessayer dans 1 heure.'
  }
  if (message.includes('invalid') || message.includes('Invalid')) {
    return 'Adresse email invalide.'
  }
  return 'Une erreur est survenue. Veuillez réessayer.'
}

function translateVerifyError(message: string): string {
  if (message.includes('expired') || message.includes('Token has expired')) {
    return 'Ce code a expiré. Demandez-en un nouveau.'
  }
  if (message.includes('invalid') || message.includes('Invalid')) {
    return 'Code incorrect. Vérifiez et réessayez.'
  }
  return 'Erreur de vérification. Veuillez réessayer.'
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
  const [sendError, setSendError] = useState('')
  const [cooldown, setCooldown] = useState(0)

  // Étape 2 — vérification OTP
  const [otp, setOtp] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [otpError, setOtpError] = useState('')

  const searchParams = useSearchParams()
  const router = useRouter()
  const otpInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchParams.get('error') === 'auth_failed') {
      setSendError('Une erreur d\'authentification est survenue. Veuillez réessayer.')
    }
  }, [searchParams])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  // Focus automatique sur le champ code quand l'étape 2 s'affiche
  useEffect(() => {
    if (sent) {
      setTimeout(() => otpInputRef.current?.focus(), 100)
    }
  }, [sent])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (cooldown > 0) return
    setLoading(true)
    setSendError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({ email })

    if (error) {
      setSendError(translateSendError(error.message))
      setLoading(false)
      if (error.message.includes('rate limit') || error.message.includes('too many') || error.message.includes('over_email_send_rate_limit')) {
        setCooldown(3600)
      }
      return
    }

    setSent(true)
    setOtp('')
    setOtpError('')
    setCooldown(COOLDOWN_SECONDS)
    setLoading(false)
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length !== 6) return
    setVerifying(true)
    setOtpError('')

    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })

    if (error) {
      setOtpError(translateVerifyError(error.message))
      setVerifying(false)
      return
    }

    router.push('/warranties')
  }

  // Étape 2 — saisie du code
  if (sent) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 mb-4">
            <KeyRound className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
            Entrez votre code
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Un code à 6 chiffres a été envoyé à{' '}
            <span className="font-medium text-slate-700 dark:text-slate-300">{email}</span>
          </p>
          <p className="text-xs text-amber-500 dark:text-amber-400 mt-2">
            Vérifiez votre dossier <span className="font-medium">indésirables / spam</span> si vous ne le voyez pas.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Code de connexion
            </label>
            <input
              ref={otpInputRef}
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              required
              className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent text-2xl font-mono tracking-[0.4em] text-center"
            />
          </div>

          {otpError && (
            <p className="text-sm text-red-600 dark:text-red-400">{otpError}</p>
          )}

          <button
            type="submit"
            disabled={verifying || otp.length !== 6}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2.5 px-4 rounded-xl font-medium text-sm hover:bg-slate-700 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {verifying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Se connecter
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          {cooldown > 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Renvoyer un code dans {formatCooldown(cooldown)}
            </p>
          ) : (
            <button
              onClick={() => { setSent(false); setOtp(''); setOtpError('') }}
              className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
            >
              Renvoyer ou utiliser une autre adresse
            </button>
          )}
        </div>
      </div>
    )
  }

  // Étape 1 — saisie de l'email
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Connexion</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Entrez votre email pour recevoir un code de connexion. Le compte sera créé automatiquement s&apos;il n&apos;existe pas encore.
      </p>

      <form onSubmit={handleSend} className="space-y-4">
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

        {sendError && (
          <p className="text-sm text-red-600 dark:text-red-400">{sendError}</p>
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
              Envoyer le code
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
