import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: record } = await supabase
    .from('shared_access')
    .select('id, owner_id, invitee_id')
    .eq('id', id)
    .single()

  if (!record) return Response.json({ error: 'Not found' }, { status: 404 })

  if (record.owner_id !== user.id && record.invitee_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  await supabase
    .from('shared_access')
    .update({ status: 'revoked' })
    .eq('id', id)

  return Response.json({ success: true })
}
