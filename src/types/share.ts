export interface SharedAccess {
  id: string
  owner_id: string
  owner_email: string
  invitee_email: string
  invitee_id: string | null
  token: string
  status: 'pending' | 'accepted' | 'revoked'
  created_at: string
  accepted_at: string | null
}
