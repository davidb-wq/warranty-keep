export interface Warranty {
  id: string
  user_id: string
  title: string
  purchase_date: string // ISO date "YYYY-MM-DD"
  warranty_months: number // -1 = lifetime
  physical_location: string
  notes: string | null
  image_url: string | null
  reminder_interval: 1 | 3 | 12 | -3 | -6
  created_at: string
}

export type WarrantyInsert = Omit<Warranty, 'id' | 'user_id' | 'created_at'>

export type WarrantyStatus = 'lifetime' | 'active' | 'expiring-soon' | 'expired'
