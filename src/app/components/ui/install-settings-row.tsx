'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, Smartphone, CheckCircle, Upload, PlusSquare, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallSettingsRow() {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)
  const [canInstall, setCanInstall] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [showIOSModal, setShowIOSModal] = useState(false)

  useEffect(() => {
    // Mode standalone = déjà installée
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    setIsStandalone(standalone)
    if (standalone) return

    // iOS Safari
    const ua = navigator.userAgent
    const iosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream
    const safariOnly = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua)
    setIsIOS(iosDevice && safariOnly)

    // Android — récupère la capture globale faite avant hydration
    const globalPrompt = (window as Window & { __pwaInstallPrompt?: BeforeInstallPromptEvent | null }).__pwaInstallPrompt
    if (globalPrompt) {
      deferredPromptRef.current = globalPrompt
      setCanInstall(true)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      deferredPromptRef.current = e as BeforeInstallPromptEvent
      setCanInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setInstalled(true))

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    const prompt = deferredPromptRef.current
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setInstalled(true)
      setCanInstall(false)
    }
    deferredPromptRef.current = null
  }

  // Déjà installée
  if (isStandalone || installed) {
    return (
      <div className="flex items-center gap-3 px-4 py-3.5">
        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Application déjà installée
        </span>
      </div>
    )
  }

  // Android — bouton d'installation
  if (canInstall) {
    return (
      <button
        onClick={handleInstall}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        <Download className="w-4 h-4 text-slate-600 dark:text-slate-300 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-slate-900 dark:text-white">
            Installer l&apos;application
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ajouter à l&apos;écran d&apos;accueil
          </p>
        </div>
      </button>
    )
  }

  // iOS — instructions manuelles
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSModal(true)}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <Smartphone className="w-4 h-4 text-slate-600 dark:text-slate-300 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              Installer l&apos;application
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Voir comment ajouter à l&apos;écran d&apos;accueil
            </p>
          </div>
        </button>

        {showIOSModal && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowIOSModal(false)}
              aria-hidden="true"
            />
            <div
              role="dialog"
              aria-modal="true"
              className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto
                         bg-white dark:bg-slate-900
                         rounded-t-3xl border-t border-slate-200 dark:border-slate-800
                         px-6 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]
                         animate-slide-up"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600 mx-auto" />
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="absolute top-4 right-4 p-1 text-slate-400"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>

              <p className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                Installer ZenGarantie
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                Suivez ces 2 étapes depuis Safari :
              </p>

              <ol className="space-y-3 mb-6">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
                    <Upload className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Appuyez sur le bouton <strong className="text-slate-900 dark:text-white">Partager</strong>
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <PlusSquare className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Puis <strong className="text-slate-900 dark:text-white">Sur l&apos;écran d&apos;accueil</strong>
                  </span>
                </li>
              </ol>

              <button
                onClick={() => setShowIOSModal(false)}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900
                           rounded-xl py-3 text-sm font-semibold active:opacity-80 transition-opacity"
              >
                Compris
              </button>
            </div>
          </>
        )}
      </>
    )
  }

  // Pas installable (navigateur non compatible, déjà dismissé le prompt natif, etc.)
  return null
}
