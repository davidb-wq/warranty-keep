import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/app/components/ui/bottom-nav'
import { PWAInstallProvider } from '@/app/components/providers/pwa-install-provider'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto">
      <main className="flex-1 overflow-y-auto pb-24">{children}</main>
      <BottomNav />
      <PWAInstallProvider />
    </div>
  )
}
