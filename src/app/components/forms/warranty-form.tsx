'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { warrantyDurationOptions } from '@/lib/warranty-utils'
import { ImageUpload } from './image-upload'
import type { Warranty, WarrantyInsert } from '@/types/warranty'

interface WarrantyFormProps {
  defaultValues?: Partial<Warranty>
  warrantyId?: string
  userId?: string
}

export function WarrantyForm({ defaultValues, warrantyId, userId }: WarrantyFormProps) {
  const router = useRouter()
  const isEdit = !!warrantyId

  const [title, setTitle] = useState(defaultValues?.title ?? '')
  const [purchaseDate, setPurchaseDate] = useState(
    defaultValues?.purchase_date ?? new Date().toISOString().split('T')[0]
  )
  const [warrantyMonths, setWarrantyMonths] = useState(
    String(defaultValues?.warranty_months ?? 12)
  )
  const [physicalLocation, setPhysicalLocation] = useState(defaultValues?.physical_location ?? '')
  const [reminderInterval, setReminderInterval] = useState<'1' | '3' | '12' | '-3' | '-6' | ''>(
    defaultValues?.reminder_interval ? String(defaultValues.reminder_interval) as '1' | '3' | '12' | '-3' | '-6' : ''
  )
  const [notes, setNotes] = useState(defaultValues?.notes ?? '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const durationOptions = warrantyDurationOptions()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    // Get current user first
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      setError('Session expirée, veuillez vous reconnecter.')
      setLoading(false)
      return
    }

    const payload: WarrantyInsert = {
      title: title.trim(),
      purchase_date: purchaseDate,
      warranty_months: parseInt(warrantyMonths),
      physical_location: physicalLocation.trim(),
      notes: notes.trim() || null,
      image_url: defaultValues?.image_url ?? null,
      reminder_interval: parseInt(reminderInterval) as 1 | 3 | 12 | -3 | -6,
    }

    try {
      let currentId = warrantyId
      let currentUserId = userId ?? user.id

      if (isEdit) {
        const { error: updateError } = await supabase
          .from('warranties')
          .update(payload)
          .eq('id', warrantyId)

        if (updateError) throw updateError
      } else {
        const { data, error: insertError } = await supabase
          .from('warranties')
          .insert({ ...payload, user_id: user.id })
          .select()
          .single()

        if (insertError) throw insertError
        currentId = data.id
        currentUserId = data.user_id ?? user.id
      }

      // Upload image if provided
      if (imageFile && currentId && currentUserId) {
        const path = `${currentUserId}/${currentId}.webp`
        const { error: uploadError } = await supabase.storage
          .from('warranty-images')
          .upload(path, imageFile, { upsert: true })

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('warranty-images')
            .getPublicUrl(path)

          await supabase
            .from('warranties')
            .update({ image_url: publicUrl })
            .eq('id', currentId)
        }
      }

      router.push('/warranties')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Nom du produit <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Réfrigérateur Samsung RF65"
          required
          className="input"
        />
      </div>

      {/* Purchase date */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Date d&apos;achat <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
          required
          className="input"
        />
      </div>

      {/* Warranty duration */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Durée de garantie <span className="text-red-500">*</span>
        </label>
        <select
          value={warrantyMonths}
          onChange={(e) => setWarrantyMonths(e.target.value)}
          className="input"
        >
          {durationOptions.map((opt) => (
            <option key={opt.months} value={opt.months}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Physical location */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Emplacement physique
        </label>
        <input
          type="text"
          value={physicalLocation}
          onChange={(e) => setPhysicalLocation(e.target.value)}
          placeholder="Ex: Tiroir bureau, classeur rouge"
          className="input"
        />
      </div>

      {/* Reminder interval */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Rappel par email <span className="text-red-500">*</span>
        </label>
        <select
          value={reminderInterval}
          onChange={(e) => setReminderInterval(e.target.value as '1' | '3' | '12' | '-3' | '-6')}
          required
          className="input"
        >
          <option value="" disabled>Choisir une fréquence</option>
          <option value="1">Chaque mois</option>
          <option value="3">Chaque 3 mois</option>
          <option value="12">Chaque année</option>
          <option value="-3">3 mois avant l&apos;expiration</option>
          <option value="-6">6 mois avant l&apos;expiration</option>
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Notes <span className="text-slate-400 text-xs font-normal">(optionnel)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Numéro de série, modèle exact, remarques…"
          rows={3}
          className="input resize-none"
        />
      </div>

      {/* Image */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Photo de la facture <span className="text-slate-400 text-xs font-normal">(optionnel)</span>
        </label>
        <ImageUpload
          value={imageFile}
          onChange={setImageFile}
          existingUrl={defaultValues?.image_url}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !title || !reminderInterval}
        className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 px-4 rounded-xl font-medium text-sm hover:bg-slate-700 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          isEdit ? 'Enregistrer les modifications' : 'Ajouter la garantie'
        )}
      </button>
    </form>
  )
}
