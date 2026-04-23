import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { BarcodeResult, WarrantyLikelihood } from '@/types/barcode'

// Marques connues pour leurs garanties fabricant
const WARRANTY_BRANDS = [
  'stanley', 'dewalt', 'milwaukee', 'bosch', 'makita', 'ryobi', 'craftsman',
  'black+decker', 'black & decker', 'ridgid', 'porter-cable', 'hitachi',
  'samsung', 'lg', 'sony', 'apple', 'microsoft', 'dell', 'hp', 'lenovo',
  'asus', 'acer', 'canon', 'nikon', 'panasonic', 'philips', 'dyson',
  'shark', 'bissell', 'roomba', 'irobot', 'kitchenaid', 'cuisinart',
  'breville', 'instant pot', 'ninja', 'vitamix', 'whirlpool', 'ge', 'maytag',
  'frigidaire', 'kenmore', 'miele', 'electrolux', 'bose', 'jbl', 'harman',
  'logitech', 'razer', 'corsair', 'weber', 'traeger', 'dewalt', 'fluke',
]

const WARRANTY_KEYWORDS = [
  'electron', 'phone', 'laptop', 'computer', 'tablet', 'tv', 'television',
  'camera', 'appliance', 'washing', 'refrigerator', 'dishwasher', 'microwave',
  'oven', 'vacuum', 'printer', 'monitor', 'speaker', 'headphone', 'earphone',
  'watch', 'tool', 'drill', 'saw', 'blender', 'coffee', 'kettle', 'iron',
  'machine', 'power', 'electric', 'battery', 'charger', 'gaming', 'console',
  'audio', 'video', 'security', 'alarm', 'smart', 'robot', 'projector',
  'router', 'modem', 'keyboard', 'mouse', 'headset', 'fan', 'heater',
  'purifier', 'humidifier', 'dehumidifier', 'compressor', 'generator',
  'nozzle', 'sprayer', 'sprinkler', 'hose', 'pump', 'garden tool',
  'wrench', 'screwdriver', 'hammer', 'plier', 'level', 'measure',
  'grinder', 'sander', 'cutter', 'stapler', 'nailer', 'flashlight',
  'ladder', 'jack', 'clamp', 'vise', 'workbench',
]

const NO_WARRANTY_KEYWORDS = [
  'food', 'drink', 'beverage', 'snack', 'cereal', 'juice', 'milk', 'bread',
  'candy', 'chocolate', 'water', 'soda', 'tea', 'sauce', 'oil', 'vinegar',
  'clothing', 'shirt', 'pants', 'shoe', 'dress', 'jacket', 'sock', 'hat',
  'cosmetic', 'beauty', 'makeup', 'shampoo', 'soap', 'lotion', 'perfume',
  'book', 'magazine', 'paper', 'pen', 'pencil',
  'grocery', 'supplement', 'vitamin', 'medicine', 'drug', 'cream',
]

function assessWarranty(
  title: string = '',
  category: string = '',
  brand: string = '',
  source: 'upcitemdb' | 'openfoodfacts'
): { likelihood: WarrantyLikelihood; message: string } {
  if (source === 'openfoodfacts') {
    return {
      likelihood: 'peu_probable',
      message: 'Les produits alimentaires ne sont généralement pas couverts par une garantie fabricant.',
    }
  }

  const text = `${title} ${category}`.toLowerCase()
  const brandLower = brand.toLowerCase()

  // Marque connue → garantie probable
  if (WARRANTY_BRANDS.some((b) => brandLower.includes(b) || b.includes(brandLower) && brandLower.length > 3)) {
    return {
      likelihood: 'probable',
      message: 'Selon nos sources, ce type de produit est généralement couvert par une garantie fabricant.',
    }
  }

  if (WARRANTY_KEYWORDS.some((k) => text.includes(k))) {
    return {
      likelihood: 'probable',
      message: 'Selon nos sources, ce type de produit est généralement couvert par une garantie fabricant.',
    }
  }

  if (NO_WARRANTY_KEYWORDS.some((k) => text.includes(k))) {
    return {
      likelihood: 'peu_probable',
      message: 'Selon nos sources, ce type de produit n\'est généralement pas couvert par une garantie fabricant.',
    }
  }

  return {
    likelihood: 'inconnue',
    message: 'Nous n\'avons pas pu déterminer si ce produit est couvert par une garantie fabricant.',
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ upc: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { upc } = await params
  if (!upc || !/^\d{6,14}$/.test(upc)) {
    return NextResponse.json({ found: false } satisfies BarcodeResult)
  }

  try {
    const upcRes = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${upc}`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 86400 },
    })

    if (upcRes.ok) {
      const data = await upcRes.json()
      const item = data?.items?.[0]
      if (item) {
        const { likelihood, message } = assessWarranty(item.title, item.category, item.brand ?? '', 'upcitemdb')
        const result: BarcodeResult = {
          found: true,
          name: item.title || undefined,
          brand: item.brand || undefined,
          model: item.model || undefined,
          warrantyLikelihood: likelihood,
          warrantyMessage: message,
        }
        return NextResponse.json(result, {
          headers: { 'Cache-Control': 'public, max-age=86400' },
        })
      }
    }

    // Fallback : Open Food Facts
    const offRes = await fetch(`https://world.openfoodfacts.org/api/v0/product/${upc}.json`, {
      next: { revalidate: 86400 },
    })

    if (offRes.ok) {
      const offData = await offRes.json()
      if (offData?.status === 1 && offData?.product) {
        const p = offData.product
        const { likelihood, message } = assessWarranty('', '', '', 'openfoodfacts')
        const result: BarcodeResult = {
          found: true,
          name: p.product_name_fr || p.product_name || undefined,
          brand: p.brands || undefined,
          model: undefined,
          warrantyLikelihood: likelihood,
          warrantyMessage: message,
        }
        return NextResponse.json(result, {
          headers: { 'Cache-Control': 'public, max-age=86400' },
        })
      }
    }
  } catch {
    // Retourne found: false silencieusement
  }

  return NextResponse.json({ found: false } satisfies BarcodeResult)
}
