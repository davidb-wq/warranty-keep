import Link from 'next/link'
import { MapPin, Users } from 'lucide-react'
import { getWarrantyStatus, STATUS_BORDER } from '@/lib/warranty-utils'
import { ExpiryBadge } from './expiry-badge'
import type { Warranty } from '@/types/warranty'

export function WarrantyCard({ warranty, signedImageUrl, sharedBy }: { warranty: Warranty; signedImageUrl?: string | null; sharedBy?: string }) {
  const status = getWarrantyStatus(warranty)

  return (
    <Link
      href={`/warranties/${warranty.id}`}
      className="block bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-slate-300 dark:hover:border-slate-600 transition-colors active:scale-[0.99] transition-transform"
    >
      <div className={`flex border-l-4 ${STATUS_BORDER[status]}`}>
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm leading-tight line-clamp-2">
              {warranty.title}
            </h3>
            {signedImageUrl && (
              <img
                src={signedImageUrl}
                alt="Facture"
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
            )}
          </div>

          <ExpiryBadge warranty={warranty} />

          {warranty.physical_location && (
            <div className="flex items-center gap-1 mt-2">
              <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {warranty.physical_location}
              </span>
            </div>
          )}
          {sharedBy && (
            <div className="flex items-center gap-1 mt-2">
              <Users className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
                {sharedBy}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
