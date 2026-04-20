import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: warranties, error } = await supabase
    .from('warranties')
    .select('id, title, purchase_date, warranty_months, physical_location, notes, image_url, reminder_interval, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const exportData = {
    exported_at: new Date().toISOString(),
    user_email: user.email,
    warranties: warranties ?? [],
  }

  const filename = `zengarantie-export-${new Date().toISOString().split('T')[0]}.json`

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
