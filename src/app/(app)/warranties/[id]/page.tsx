import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Calendar, Clock, Pencil, Trash2, FileText } from 'lucide-react'
import { ExpiryBadge } from '@/app/components/ui/expiry-badge'
import { ImageLightbox } from '@/app/components/ui/image-lightbox'
import { formatExpiryDate, warrantyDurationOptions } from '@/lib/warranty-utils'
import type { Warranty } from '@/types/warranty'

async function deleteWarranty(id: string, userId: string) {
  'use server'
  const supabase = await createClient()
  await supabase.from('warranties').delete().eq('id', id)
  await supabase.storage.from('warranty-images').remove([`${userId}/${id}.webp`])
  redirect('/warranties')
}

export default async function WarrantyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: warranty } = await supabase
    .from('warranties')
    .select('*')
    .eq('id', id)
    .single()

  if (!warranty) notFound()

  const isShared = warranty.user_id !== user!.id

  const w = warranty as Warranty

  // Génère une signed URL valable 1h pour afficher la photo en privé
  let signedImageUrl: string | null = null
  if (w.image_url) {
    const storagePath = w.image_url.includes('/warranty-images/')
      ? w.image_url.split('/warranty-images/')[1]
      : w.image_url
    const { data } = await supabase.storage
      .from('warranty-images')
      .createSignedUrl(storagePath, 3600)
    signedImageUrl = data?.signedUrl ?? null
  }

  const durationLabel =
    warrantyDurationOptions().find((o) => o.months === w.warranty_months)?.label ??
    `${w.warranty_months} mois`

  const deleteAction = deleteWarranty.bind(null, w.id, w.user_id)

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/warranties"
          className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white flex-1 line-clamp-1">
          {w.title}
        </h1>
        {!isShared && (
          <Link
            href={`/warranties/${w.id}/edit`}
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <Pencil className="w-5 h-5" />
          </Link>
        )}
      </div>

      <div className="mb-4">
        <ExpiryBadge warranty={w} />
      </div>

      {signedImageUrl && (
        <div className="mb-6">
          <ImageLightbox src={signedImageUrl} alt="Facture" />
        </div>
      )}

      <div className="space-y-3">
        <InfoRow
          icon={<Calendar className="w-4 h-4" />}
          label="Date d'achat"
          value={new Date(w.purchase_date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        />
        <InfoRow
          icon={<Clock className="w-4 h-4" />}
          label="Durée de garantie"
          value={durationLabel}
        />
        <InfoRow
          icon={<Clock className="w-4 h-4" />}
          label="Date d'expiration"
          value={formatExpiryDate(w)}
        />
        {w.physical_location && (
          <InfoRow
            icon={<MapPin className="w-4 h-4" />}
            label="Emplacement physique"
            value={w.physical_location}
          />
        )}
        {w.notes && (
          <InfoRow
            icon={<FileText className="w-4 h-4" />}
            label="Notes"
            value={w.notes}
          />
        )}
        <InfoRow
          icon={<Clock className="w-4 h-4" />}
          label="Rappel"
          value={formatReminderInterval(w.reminder_interval)}
        />
      </div>

      {!isShared && (
        <form action={deleteAction} className="mt-8">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 py-2.5 px-4 rounded-xl font-medium text-sm hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer cette garantie
          </button>
        </form>
      )}
    </div>
  )
}

function formatReminderInterval(interval: number): string {
  if (interval === 1) return 'Chaque mois'
  if (interval === 3) return 'Chaque 3 mois'
  if (interval === 12) return 'Chaque année'
  if (interval === -3) return "3 mois avant l'expiration"
  if (interval === -6) return "6 mois avant l'expiration"
  return `${interval} mois`
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 bg-white dark:bg-slate-800 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700">
      <span className="text-slate-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-slate-900 dark:text-white break-words">{value}</p>
      </div>
    </div>
  )
}
