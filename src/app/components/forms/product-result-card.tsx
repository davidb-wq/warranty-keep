'use client'

import { X, ExternalLink, ShieldCheck, ShieldX, ShieldQuestion } from 'lucide-react'
import type { BarcodeResult } from '@/types/barcode'

interface ProductResultCardProps {
  product: BarcodeResult
  onDismiss: () => void
}

const WARRANTY_STYLES = {
  probable: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-200 dark:border-green-800',
    icon: ShieldCheck,
    iconColor: 'text-green-600 dark:text-green-400',
    textColor: 'text-green-800 dark:text-green-300',
  },
  peu_probable: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    icon: ShieldX,
    iconColor: 'text-red-500 dark:text-red-400',
    textColor: 'text-red-800 dark:text-red-300',
  },
  inconnue: {
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    border: 'border-slate-200 dark:border-slate-700',
    icon: ShieldQuestion,
    iconColor: 'text-slate-400 dark:text-slate-500',
    textColor: 'text-slate-600 dark:text-slate-400',
  },
}

export function ProductResultCard({ product, onDismiss }: ProductResultCardProps) {
  if (!product.found) {
    return (
      <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 relative">
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
        <p className="text-sm text-slate-500 dark:text-slate-400 pr-6">
          Produit non trouvé pour ce code-barres.
        </p>
      </div>
    )
  }

  const likelihood = product.warrantyLikelihood ?? 'inconnue'
  const styles = WARRANTY_STYLES[likelihood]
  const WarrantyIcon = styles.icon
  const searchQuery = encodeURIComponent(`${product.name ?? ''} garantie fabricant`)

  return (
    <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
      {/* Infos produit */}
      <div className="p-4 relative">
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="pr-6">
          {product.name && (
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{product.name}</p>
          )}
          {(product.brand || product.model) && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {[product.brand, product.model].filter(Boolean).join(' — ')}
            </p>
          )}
        </div>
      </div>

      {/* Bloc garantie */}
      <div className={`mx-4 mb-3 rounded-xl border p-3 ${styles.bg} ${styles.border}`}>
        <div className="flex items-start gap-2.5">
          <WarrantyIcon className={`w-5 h-5 mt-0.5 shrink-0 ${styles.iconColor}`} />
          <p className={`text-sm font-medium leading-snug ${styles.textColor}`}>
            {product.warrantyMessage ?? 'Nous n\'avons pas pu déterminer si ce produit est couvert par une garantie fabricant.'}
          </p>
        </div>
      </div>

      {/* Lien + disclaimer */}
      <div className="px-4 pb-4 space-y-2.5">
        <a
          href={`https://www.google.com/search?q=${searchQuery}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Rechercher la garantie fabricant
        </a>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 leading-snug">
          Informez-vous auprès du personnel du magasin pour en être certain.
        </p>
      </div>
    </div>
  )
}
