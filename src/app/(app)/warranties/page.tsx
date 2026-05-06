import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, ShieldOff, Users } from 'lucide-react'
import { WarrantyCard } from '@/app/components/ui/warranty-card'
import { DashboardScanner } from '@/app/components/ui/dashboard-scanner'
import { getWarrantyStatus } from '@/lib/warranty-utils'
import type { Warranty, WarrantyStatus } from '@/types/warranty'

const STATUS_ORDER: WarrantyStatus[] = ['expiring-soon', 'active', 'lifetime', 'expired']

function sortWarranties(warranties: Warranty[]): Warranty[] {
  return [...warranties].sort((a, b) => {
    const statusA = STATUS_ORDER.indexOf(getWarrantyStatus(a))
    const statusB = STATUS_ORDER.indexOf(getWarrantyStatus(b))
    if (statusA !== statusB) return statusA - statusB
    return new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime()
  })
}

async function generateSignedUrls(
  supabase: Awaited<ReturnType<typeof createClient>>,
  warranties: Warranty[]
): Promise<Map<string, string>> {
  const withImages = warranties.filter(w => w.image_url)
  const paths = withImages.map(w =>
    w.image_url!.includes('/warranty-images/')
      ? w.image_url!.split('/warranty-images/')[1]
      : w.image_url!
  )
  const map = new Map<string, string>()
  if (paths.length === 0) return map
  const { data } = await supabase.storage.from('warranty-images').createSignedUrls(paths, 3600)
  data?.forEach((item, i) => {
    if (item.signedUrl) map.set(withImages[i].id, item.signedUrl)
  })
  return map
}

export default async function WarrantiesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const isSharedTab = tab === 'shared'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (isSharedTab) {
    // Fetch all accepted shared_access records where current user is invitee
    const { data: shares } = await supabase
      .from('shared_access')
      .select('id, owner_id, owner_email')
      .eq('invitee_id', user!.id)
      .eq('status', 'accepted')

    if (!shares || shares.length === 0) {
      return (
        <div className="px-4 pt-6 pb-4">
          <TabBar active="shared" />
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
              Aucun partage actif
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs">
              Personne ne vous a encore partagé ses garanties.
            </p>
          </div>
        </div>
      )
    }

    const ownerIds = shares.map(s => s.owner_id)

    // Fetch warranties for all owners (invitee_read RLS policy permits this)
    const { data: sharedWarranties } = await supabase
      .from('warranties')
      .select('*')
      .in('user_id', ownerIds)
      .order('created_at', { ascending: false })

    const allWarranties = (sharedWarranties as Warranty[]) ?? []
    const signedUrlMap = await generateSignedUrls(supabase, allWarranties)

    // Group by owner
    const byOwner = shares.map(share => ({
      ownerEmail: share.owner_email,
      ownerId: share.owner_id,
      warranties: sortWarranties(allWarranties.filter(w => w.user_id === share.owner_id)),
    }))

    const total = allWarranties.length

    return (
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Garanties partagées</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {total} produit{total !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <TabBar active="shared" />

        {byOwner.map(group => (
          <div key={group.ownerId} className="mb-6">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">
              {group.ownerEmail}
            </p>
            {group.warranties.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 px-1">Aucune garantie.</p>
            ) : (
              <div className="space-y-3">
                {group.warranties.map(warranty => (
                  <WarrantyCard
                    key={warranty.id}
                    warranty={warranty}
                    signedImageUrl={signedUrlMap.get(warranty.id) ?? null}
                    hrefOverride={`/warranties/${warranty.id}?shared=true`}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Onglet par défaut — Mes garanties
  const { data: warranties } = await supabase
    .from('warranties')
    .select('*')
    .order('created_at', { ascending: false })

  // Filter to only own warranties (exclude shared ones returned by invitee_read policy)
  const ownWarranties = ((warranties as Warranty[]) ?? []).filter(w => w.user_id === user!.id)
  const sorted = sortWarranties(ownWarranties)
  const signedUrlMap = await generateSignedUrls(supabase, sorted)

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Mes garanties</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {sorted.length} produit{sorted.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/add"
          className="flex items-center gap-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </Link>
      </div>

      <TabBar active="mine" />
      <DashboardScanner />

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
            <ShieldOff className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            Aucune garantie
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs">
            Commencez par ajouter la garantie d&apos;un de vos produits.
          </p>
          <Link
            href="/add"
            className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-xl text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Ajouter ma première garantie
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((warranty) => (
            <WarrantyCard key={warranty.id} warranty={warranty} signedImageUrl={signedUrlMap.get(warranty.id) ?? null} />
          ))}
        </div>
      )}
    </div>
  )
}

function TabBar({ active }: { active: 'mine' | 'shared' }) {
  return (
    <div className="flex gap-1 mb-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
      <Link
        href="/warranties"
        className={`flex-1 text-center py-1.5 rounded-lg text-sm font-medium transition-colors ${
          active === 'mine'
            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
        }`}
      >
        Mes garanties
      </Link>
      <Link
        href="/warranties?tab=shared"
        className={`flex-1 text-center py-1.5 rounded-lg text-sm font-medium transition-colors ${
          active === 'shared'
            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
        }`}
      >
        Partagées
      </Link>
    </div>
  )
}
