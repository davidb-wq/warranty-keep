'use client'

import { useState, useEffect } from 'react'
import { Barcode, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BarcodeScannerModal } from '@/app/components/forms/barcode-scanner-modal'
import { ProductResultCard } from '@/app/components/forms/product-result-card'
import type { BarcodeResult } from '@/types/barcode'

const MAX_SCANS = 3
const UNLIMITED_EMAIL = 'davidblouin03@gmail.com'

function getScanUsage(): { date: string; count: number } {
  try {
    const raw = localStorage.getItem('scan-usage')
    if (!raw) return { date: '', count: 0 }
    return JSON.parse(raw)
  } catch { return { date: '', count: 0 } }
}

function getRemainingScans(): number {
  const today = new Date().toISOString().split('T')[0]
  const usage = getScanUsage()
  if (usage.date !== today) return MAX_SCANS
  return Math.max(0, MAX_SCANS - usage.count)
}

function incrementScanCount(): void {
  const today = new Date().toISOString().split('T')[0]
  const usage = getScanUsage()
  const count = usage.date === today ? usage.count + 1 : 1
  localStorage.setItem('scan-usage', JSON.stringify({ date: today, count }))
}

export function DashboardScanner() {
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scannedProduct, setScannedProduct] = useState<BarcodeResult | null>(null)
  const [scanLoading, setScanLoading] = useState(false)
  const [remaining, setRemaining] = useState(MAX_SCANS)
  const [unlimited, setUnlimited] = useState(false)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email === UNLIMITED_EMAIL) {
        setUnlimited(true)
      } else {
        setRemaining(getRemainingScans())
      }
    }
    init()
  }, [])

  const canScan = unlimited || remaining > 0

  async function handleScan(barcode: string) {
    setScannerOpen(false)
    setScanLoading(true)
    if (!unlimited) {
      incrementScanCount()
      setRemaining(getRemainingScans())
    }

    try {
      const res = await fetch(`/api/barcode/${barcode}`)
      const data: BarcodeResult = await res.json()
      setScannedProduct(data)
    } catch {
      setScannedProduct({ found: false })
    } finally {
      setScanLoading(false)
    }
  }

  return (
    <div className="mb-5">
      <button
        type="button"
        onClick={() => canScan ? setScannerOpen(true) : undefined}
        disabled={!canScan}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-sm font-medium transition-colors ${
          canScan
            ? 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-200'
            : 'border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
        }`}
      >
        <Barcode className="w-4 h-4" />
        Scanner un code-barres produit
      </button>

      {unlimited ? (
        <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
          Scans illimités
        </p>
      ) : remaining > 0 ? (
        <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
          {remaining}/{MAX_SCANS} scan{remaining > 1 ? 's' : ''} restant{remaining > 1 ? 's' : ''}{' '}aujourd&apos;hui
        </p>
      ) : (
        <p className="mt-3 text-center text-xs text-amber-600 dark:text-amber-400">
          Limite quotidienne atteinte — revenez demain
        </p>
      )}

      {scanLoading && (
        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Recherche du produit…
        </div>
      )}

      {scannedProduct && (
        <ProductResultCard
          product={scannedProduct}
          onDismiss={() => setScannedProduct(null)}
        />
      )}

      {scannerOpen && (
        <BarcodeScannerModal
          onScan={handleScan}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  )
}
