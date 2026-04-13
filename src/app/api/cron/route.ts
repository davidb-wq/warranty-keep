import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { WarrantyReminderEmail } from '@/../emails/warranty-reminder'

const resend = new Resend(process.env.RESEND_API_KEY)

interface WarrantyWithExpiry {
  id: string
  user_id: string
  title: string
  expiry_date: string
  reminder_interval: number
}

export async function GET(request: Request) {
  // Verify the request comes from Vercel cron (or manual test)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Service role client — bypasses RLS for cron queries
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const sixMonthsFromNow = new Date(today)
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)

  // Fetch non-lifetime warranties expiring within 6 months
  const { data: warranties, error } = await supabase
    .from('warranties_with_expiry')
    .select('id, user_id, title, expiry_date, reminder_interval')
    .gte('expiry_date', today.toISOString().split('T')[0])
    .lte('expiry_date', sixMonthsFromNow.toISOString().split('T')[0])

  if (error) {
    console.error('Cron query error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }

  if (!warranties?.length) {
    return Response.json({ sent: 0, message: 'No warranties to remind' })
  }

  // Group by user_id
  const byUser = (warranties as WarrantyWithExpiry[]).reduce(
    (acc, w) => {
      if (!acc[w.user_id]) acc[w.user_id] = []
      acc[w.user_id].push(w)
      return acc
    },
    {} as Record<string, WarrantyWithExpiry[]>
  )

  let sent = 0

  for (const [userId, userWarranties] of Object.entries(byUser)) {
    // Filter: only include warranties within each user's chosen reminder window
    const relevant = userWarranties.filter((w) => {
      const daysLeft = Math.ceil(
        (new Date(w.expiry_date).getTime() - today.getTime()) / 86400000
      )
      return daysLeft <= w.reminder_interval * 30
    })

    if (!relevant.length) continue

    // Get user email via admin API
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)
    if (userError || !userData?.user?.email) continue

    const userEmail = userData.user.email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://zen-garantie.vercel.app'

    const warrantyItems = relevant.map((w) => ({
      title: w.title,
      expiryDate: new Date(w.expiry_date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      daysLeft: Math.ceil(
        (new Date(w.expiry_date).getTime() - today.getTime()) / 86400000
      ),
    }))

    const { error: emailError } = await resend.emails.send({
      from: 'ZenGarantie <onboarding@resend.dev>',
      to: userEmail,
      subject:
        relevant.length === 1
          ? `Rappel : "${relevant[0].title}" expire bientôt`
          : `Rappel : ${relevant.length} garanties expirent bientôt`,
      react: WarrantyReminderEmail({
        email: userEmail,
        warranties: warrantyItems,
        appUrl,
      }),
    })

    if (!emailError) sent++
  }

  return Response.json({ sent, total: warranties.length })
}
