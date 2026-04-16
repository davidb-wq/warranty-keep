'use client'

import { Shield, Upload, PlusSquare } from 'lucide-react'
import { usePwaInstall } from '@/hooks/use-pwa-install'

export function InstallSheet() {
  const { canInstallAndroid, isIOS, showSheet, triggerInstall, dismissSheet } = usePwaInstall()

  if (!showSheet) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={dismissSheet}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Installer ZenGarantie"
        className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto
                   bg-white dark:bg-slate-900
                   rounded-t-3xl
                   border-t border-slate-200 dark:border-slate-800
                   px-6 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]
                   animate-slide-up"
      >
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600 mx-auto mb-5" />

        {/* Identité app */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-white dark:text-slate-900" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">ZenGarantie</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Ajouter à l&apos;écran d&apos;accueil</p>
          </div>
        </div>

        {/* Android */}
        {canInstallAndroid && (
          <>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
              Installez l&apos;application pour accéder à vos garanties en un tap, même sans connexion.
            </p>
            <button
              onClick={triggerInstall}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900
                         rounded-xl py-3 text-sm font-semibold mb-2
                         active:opacity-80 transition-opacity"
            >
              Installer
            </button>
            <button
              onClick={dismissSheet}
              className="w-full text-slate-500 dark:text-slate-400 text-sm py-2
                         active:opacity-60 transition-opacity"
            >
              Pas maintenant
            </button>
          </>
        )}

        {/* iOS */}
        {isIOS && !canInstallAndroid && (
          <>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Pour installer l&apos;application :
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
              onClick={dismissSheet}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900
                         rounded-xl py-3 text-sm font-semibold
                         active:opacity-80 transition-opacity"
            >
              Compris
            </button>
          </>
        )}
      </div>
    </>
  )
}
