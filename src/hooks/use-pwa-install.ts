'use client'

import { useEffect, useRef, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

const STORAGE_KEY = 'pwa-install-dismissed'

export function usePwaInstall() {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)
  const [canInstallAndroid, setCanInstallAndroid] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(true)
  const [dismissed, setDismissed] = useState(true) // défaut true = caché côté serveur

  useEffect(() => {
    // Lecture localStorage côté client uniquement
    const alreadyDismissed = localStorage.getItem(STORAGE_KEY) === 'true'
    setDismissed(alreadyDismissed)

    // Détection mode standalone
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    setIsStandalone(standalone)
    if (standalone) return

    // Détection iOS Safari
    const ua = navigator.userAgent
    const iosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream
    const safariOnly = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua)
    setIsIOS(iosDevice && safariOnly)

    // Détection Android/Chrome via beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      deferredPromptRef.current = e as BeforeInstallPromptEvent
      setCanInstallAndroid(true)
    }
    window.addEventListener('beforeinstallprompt', handler)

    const installedHandler = () => {
      setCanInstallAndroid(false)
      dismiss()
    }
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, 'true')
    setDismissed(true)
  }

  async function triggerInstall() {
    const prompt = deferredPromptRef.current
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'dismissed') {
      dismiss()
    }
    deferredPromptRef.current = null
    setCanInstallAndroid(false)
  }

  const showSheet = !dismissed && !isStandalone && (canInstallAndroid || isIOS)

  return { canInstallAndroid, isIOS, showSheet, triggerInstall, dismissSheet: dismiss }
}
