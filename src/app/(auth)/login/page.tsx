'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, Loader2, KeyRound } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function MicrosoftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path fill="#F25022" d="M1 1h10.5v10.5H1z" />
      <path fill="#00A4EF" d="M1 12.5h10.5V23H1z" />
      <path fill="#7FBA00" d="M12.5 1H23v10.5H12.5z" />
      <path fill="#FFB900" d="M12.5 12.5H23V23H12.5z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}


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

  async function handleOAuthSignIn(provider: 'google' | 'azure') {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

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
    if (otp.length !== 8) return
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
            Un code à 8 chiffres a été envoyé à{' '}
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
              maxLength={8}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="12345678"
              required
              className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent text-2xl font-mono tracking-[0.4em] text-center"
            />
          </div>

          {otpError && (
            <p className="text-sm text-red-600 dark:text-red-400">{otpError}</p>
          )}

          <button
            type="submit"
            disabled={verifying || otp.length !== 8}
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
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Connexion</h2>

      {/* OAuth buttons */}
      <div className="space-y-3 mb-6">
        <button
          type="button"
          onClick={() => handleOAuthSignIn('google')}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <GoogleIcon />
          Continuer avec Google
        </button>
        <button
          type="button"
          onClick={() => handleOAuthSignIn('azure')}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <MicrosoftIcon />
          Continuer avec Microsoft
        </button>
      </div>

      {/* Separator */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-700" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white dark:bg-slate-800 px-3 text-slate-400 dark:text-slate-500">ou continuer avec l&apos;email</span>
        </div>
      </div>

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

      {/* Avis de confidentialité — couvre OTP et OAuth */}
      <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-4 leading-relaxed">
        En vous connectant, vous acceptez que ZenGarantie traite votre
        adresse email conformément à notre{' '}
        <Link
          href="/confidentialite"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          politique de confidentialité
        </Link>
        .
      </p>
    </div>
  )
}
