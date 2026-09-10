import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description: 'RADVORA Technologies shipping, tracking, delivery, and address policy.'
}

const sections = [
  ['Order processing', 'Orders are prepared for fulfilment after successful payment confirmation and any required fraud or inventory checks. Processing time can vary by product availability, destination, and operational conditions.'],
  ['Delivery estimates', 'Any delivery date or transit estimate shown at checkout, in an order update, or by a carrier is an estimate unless explicitly stated as guaranteed. Delays can occur because of carrier capacity, weather, address issues, customs, public holidays, force majeure, or other events outside reasonable control.'],
  ['Shipping address', 'Customers are responsible for providing a complete and accurate delivery address. If an address needs correction, contact Support as soon as possible. Once an order has entered carrier fulfilment, an address change may no longer be possible.'],
  ['Tracking', 'Where tracking is available, RADVORA may provide the carrier name, tracking number, and a tracking link in the customer order view or other order communications. Carrier tracking can take time to update after a shipment is created.'],
  ['Failed or returned delivery', 'If a shipment cannot be delivered and is returned to RADVORA or its fulfilment partner, Support will review the reason and advise on reshipment, cancellation, or refund options subject to applicable costs and consumer law.'],
  ['International shipments', 'For international deliveries, customs clearance, import restrictions, duties, taxes, or brokerage charges may apply depending on the destination and the transaction terms. Where such charges are not included in the order price, the recipient may be responsible for them.'],
  ['Loss or damage in transit', 'If tracking indicates a delivery problem or the parcel arrives visibly damaged, contact Support promptly with the order reference and available evidence. RADVORA may coordinate with the carrier before approving a replacement, refund, or other remedy.'],
]

export default function ShippingPage(){
  return <main className="page-shell"><div className="content-card prose-card"><p className="eyebrow">RADVORA TECHNOLOGIES</p><h1>Shipping Policy</h1><p>Last updated: 11 September 2026</p><p>This policy explains the general RADVORA shipping and delivery process. Specific products, destinations, or commercial orders may have additional terms disclosed at purchase.</p>{sections.map(([title, body])=><section key={title}><h2>{title}</h2><p>{body}</p></section>)}</div></main>
}
