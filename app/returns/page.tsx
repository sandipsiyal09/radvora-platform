import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Returns & Refunds',
  description: 'RADVORA Technologies returns, refunds, damaged-delivery, and replacement policy.'
}

const sections = [
  ['Before returning a product', 'Please contact RADVORA Support before sending any item back. Include the order reference, product, reason for the request, and photos or other evidence where the item arrived damaged, incomplete, or materially different from what was ordered.'],
  ['Unpaid order cancellation', 'A customer may cancel an order while it is still pending and no payment has been captured. Once payment has been captured or fulfilment has progressed, cancellation or return eligibility is handled under the applicable refund, return, and consumer-rights process instead.'],
  ['Eligibility', 'Return or replacement eligibility depends on the product condition, reason for return, applicable consumer law, and any product-specific terms shown at purchase. Items that have been materially altered, intentionally damaged, misused, or returned without required components may not qualify except where law requires otherwise.'],
  ['Damaged, defective, or incorrect deliveries', 'Report visible transit damage, missing items, or an incorrect product as soon as reasonably possible after delivery. RADVORA may request photos, packaging information, serial or verification details, and other evidence needed to investigate with the carrier or fulfilment partner.'],
  ['Change-of-mind requests', 'Where a change-of-mind return is offered for a particular product or market, the item should be unused or in substantially original condition with its supplied accessories and packaging. Product-specific exclusions may apply where hygiene, customization, activation, or other legitimate restrictions make a return unsuitable.'],
  ['Refund processing', 'For online gateway payments, an approved refund is initiated back through the original payment method used for the transaction. RADVORA treats a refund as completed only after the payment provider confirms it server-side. Banks and payment providers may take additional time to reflect a processed refund in the customer account.'],
  ['Shipping costs', 'Responsibility for return-shipping costs depends on the reason for return, applicable law, and the instructions issued by RADVORA Support. Do not send a return using an unapproved method where special routing or documentation has been provided.'],
  ['Warranty versus return', 'A product that develops a covered fault after the applicable return period may be handled under the RADVORA Warranty process rather than as a standard return. Warranty approval depends on the relevant warranty terms and product assessment.'],
  ['Consumer rights', 'Nothing in this policy limits mandatory rights available under applicable consumer-protection law. Where local law provides stronger rights than this policy, those legal rights prevail.'],
]

export default function ReturnsPage(){
  return <main className="page-shell"><div className="content-card prose-card"><p className="eyebrow">RADVORA TECHNOLOGIES</p><h1>Returns &amp; Refunds</h1><p>Last updated: 11 September 2026</p><p>This policy describes the general RADVORA process for returns, refunds, replacements, damaged deliveries, and related customer requests. Product- or market-specific terms may also apply.</p>{sections.map(([title, body])=><section key={title}><h2>{title}</h2><p>{body}</p></section>)}</div></main>
}
