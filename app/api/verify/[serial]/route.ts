import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ serial: string }> }

export async function GET(_request: Request, context: Context) {
  const { serial } = await context.params
  const normalized = decodeURIComponent(serial).trim().toUpperCase()

  if (!normalized || normalized.length > 80) {
    return NextResponse.json({ ok: false, error: 'invalid_serial' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('public_product_verification')
    .select('serial_number,batch_code,manufactured_at,status,product_name,product_slug,sku')
    .eq('serial_number', normalized)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ ok: false, error: 'verification_unavailable' }, { status: 503 })
  }

  if (!data) {
    return NextResponse.json({ ok: true, found: false }, { status: 200 })
  }

  return NextResponse.json({
    ok: true,
    found: true,
    product: {
      name: data.product_name,
      slug: data.product_slug,
      sku: data.sku,
    },
    serial: data.serial_number,
    batch: data.batch_code,
    manufacturedAt: data.manufactured_at,
    status: data.status,
  }, { status: 200 })
}
