import { createClient } from '@supabase/supabase-js'
import { render } from '@react-email/render'
import { WarrantyReminderEmail } from '@/../emails/warranty-reminder'

interface WarrantyWithExpiry {
  id: string
  user_id: string
  title: string
  purchase_date: string
  expiry_date: string
  reminder_interval: number
}

export async function GET(request: Request) {
  // Verify the request is authorized: Vercel cron header OR valid Bearer secret
  const authHeader = request.headers.get('authorization')
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  const hasValidSecret = !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`

  if (!isVercelCron && !hasValidSecret) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Service role client — bypasses RLS for cron queries
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Fetch all non-lifetime warranties that haven't expired yet
  const { data: warranties, error } = await supabase
    .from('warranties_with_expiry')
    .select('id, user_id, title, purchase_date, expiry_date, reminder_interval')
    .gte('expiry_date', today.toISOString().split('T')[0])

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
    // Filter: apply reminder logic based on interval type
    const relevant = userWarranties.filter((w) => {
      if (w.reminder_interval > 0) {
        // Rolling: fire on the same day-of-month as purchase_date, every N months
        const purchase = new Date(w.purchase_date)
        if (today.getDate() !== purchase.getDate()) return false
        const monthsSincePurchase =
          (today.getFullYear() - purchase.getFullYear()) * 12 +
          (today.getMonth() - purchase.getMonth())
        return monthsSincePurchase > 0 && monthsSincePurchase % w.reminder_interval === 0
      } else {
        // Before expiry: fire on the exact date that is N months before expiry_date
        const expiry = new Date(w.expiry_date)
        const months = Math.abs(w.reminder_interval)
        const target = new Date(expiry)
        target.setMonth(target.getMonth() - months)
        return (
          today.getFullYear() === target.getFullYear() &&
          today.getMonth() === target.getMonth() &&
          today.getDate() === target.getDate()
        )
      }
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

    const html = await render(WarrantyReminderEmail({
      email: userEmail,
      warranties: warrantyItems,
      appUrl,
    }))

    const subject = relevant.length === 1
      ? `Rappel : "${relevant[0].title}" expire bientôt`
      : `Rappel : ${relevant.length} garanties expirent bientôt`

    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'ZenGarantie', email: 'davidblouin03@gmail.com' },
        to: [{ email: userEmail }],
        subject,
        htmlContent: html,
      }),
    })

    if (brevoRes.ok) {
      sent++
    } else {
      const errorBody = await brevoRes.text()
      console.error(`Brevo error for ${userEmail} — status ${brevoRes.status}: ${errorBody}`)
    }
  }

  return Response.json({ sent, total: warranties.length, errors: Object.keys(byUser).length - sent })
}
