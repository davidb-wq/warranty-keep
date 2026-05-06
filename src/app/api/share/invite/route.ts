import { createClient } from '@/lib/supabase/server'
import { render } from '@react-email/render'
import { ShareInviteEmail } from '@/../emails/share-invite'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let inviteeEmail: string
  try {
    const body = await request.json()
    inviteeEmail = (body.email ?? '').trim().toLowerCase()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Basic email validation
  if (!inviteeEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteeEmail)) {
    return Response.json({ error: 'Adresse email invalide.' }, { status: 400 })
  }

  if (inviteeEmail === user.email?.toLowerCase()) {
    return Response.json({ error: 'Vous ne pouvez pas vous inviter vous-même.' }, { status: 400 })
  }

  const { data: record, error: insertError } = await supabase
    .from('shared_access')
    .insert({
      owner_id: user.id,
      owner_email: user.email!,
      invitee_email: inviteeEmail,
    })
    .select('token')
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      return Response.json({ error: 'Une invitation a déjà été envoyée à cette adresse.' }, { status: 409 })
    }
    return Response.json({ error: insertError.message }, { status: 500 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://zen-garantie.vercel.app'
  const acceptUrl = `${appUrl}/share/accept?token=${record.token}`

  const html = await render(ShareInviteEmail({ ownerEmail: user.email!, acceptUrl }))

  const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'ZenGarantie', email: 'davidblouin03@gmail.com' },
      to: [{ email: inviteeEmail }],
      subject: `${user.email} vous invite sur ZenGarantie`,
      htmlContent: html,
    }),
  })

  if (!brevoRes.ok) {
    const errBody = await brevoRes.text()
    console.error(`Brevo error — status ${brevoRes.status}: ${errBody}`)
    return Response.json({ error: "Erreur lors de l'envoi de l'email. Veuillez réessayer." }, { status: 500 })
  }

  return Response.json({ success: true })
}
