import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description: 'RADVORA Technologies India shipping, tracking, delivery, and address policy.'
}

const sections = [
  ['India-only delivery phase', 'RADVORA consumer orders are currently accepted for delivery within India only. An Indian delivery address and valid six-digit PIN code are required at checkout. International shipping is not offered during the current launch phase.'],
  ['Order processing', 'Orders are prepared for fulfilment after successful server-side payment confirmation and any required inventory or operational checks. Processing time can vary by product availability and delivery location.'],
  ['Delivery estimates', 'Any delivery date or transit estimate shown at checkout, in an order update, or by a carrier is an estimate unless explicitly stated as guaranteed. Delays can occur because of carrier capacity, weather, address issues, public holidays, force majeure, or other events outside reasonable control.'],
  ['Shipping address', 'Customers are responsible for providing a complete and accurate Indian delivery address, mobile number, state or union territory, and PIN code. If an address needs correction, contact Support as soon as possible. Once an order has entered carrier fulfilment, an address change may no longer be possible.'],
  ['Tracking', 'Where tracking is available, RADVORA may provide the carrier name, tracking number, and tracking link in the customer order view or other order communications. Carrier tracking can take time to update after a shipment is created.'],
  ['Failed or returned delivery', 'If a shipment cannot be delivered and is returned to RADVORA or its fulfilment partner, Support will review the reason and advise on reshipment, cancellation, or refund options subject to applicable costs and consumer law.'],
  ['Loss or damage in transit', 'If tracking indicates a delivery problem or the parcel arrives visibly damaged, contact Support promptly with the order reference and available evidence. RADVORA may coordinate with the carrier before approving a replacement, refund, or other remedy.'],
]

export default function ShippingPage(){
  return <main className="page-shell"><div className="content-card prose-card"><p className="eyebrow">RADVORA TECHNOLOGIES · INDIA</p><h1>Shipping Policy</h1><p>Last updated: 11 September 2026</p><p>This policy explains the current RADVORA shipping and delivery process for consumer orders within India. Product-specific or commercial-order terms may also apply where disclosed before purchase.</p>{sections.map(([title, body])=><section key={title}><h2>{title}</h2><p>{body}</p></section>)}</div></main>
}
