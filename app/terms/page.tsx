import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms governing use of the RADVORA Technologies website, accounts, products, and customer services in India.'
}

const sections = [
  ['Using the website', 'You may use the RADVORA website for lawful personal or business purposes. You must not misuse the service, attempt unauthorized access, interfere with security controls, submit fraudulent information, or use the platform in a way that violates applicable law or another person’s rights.'],
  ['Accounts', 'You are responsible for maintaining the confidentiality of your account credentials and for activity performed through your account. Please provide accurate information and notify us if you believe your account has been compromised.'],
  ['Product information and evidence', 'RADVORA describes product capabilities using the evidence available for each product and development stage. Prototype, pre-test, research, or pending-verification statements are not representations of clinically proven health outcomes. Product pages, labels, installation guidance, and published test information should be read together.'],
  ['India consumer launch', 'RADVORA consumer commerce is currently offered in India only. Orders are priced and processed in Indian rupees (INR), and delivery requires an eligible Indian address. Availability may be expanded to other markets later under separate terms.'],
  ['Orders and payment', 'Submitting an order or starting checkout does not guarantee acceptance. An order is treated as paid only after server-side verification through the configured Indian payment system. A browser redirect, payment-screen message, or client callback alone is not proof of payment. We may cancel or refund an order where payment fails, stock is unavailable, pricing is clearly erroneous, fraud is suspected, or fulfilment is not legally or operationally possible.'],
  ['Delivery', 'Current consumer deliveries are limited to India. Delivery estimates are indicative unless explicitly stated otherwise. Carrier delays, address errors, public holidays, force majeure, or other circumstances outside reasonable control may affect delivery timing.'],
  ['Returns and warranty', 'Returns, refunds, replacements, and warranty service are governed by the applicable RADVORA Returns & Refunds Policy and Warranty terms in effect for the relevant product and transaction.'],
  ['Intellectual property', 'RADVORA names, branding, product designs, website content, documentation, graphics, software, and other materials are protected by applicable intellectual-property laws. No rights are transferred except the limited right to use purchased products and access the website for their intended purposes.'],
  ['Third-party services', 'The website may rely on third-party services such as payment processors, authentication providers, hosting providers, logistics companies, or external links. Those services may be governed by separate terms and policies.'],
  ['No medical advice', 'RADVORA content is provided for product, engineering, educational, and commercial information. It is not medical advice, diagnosis, or treatment guidance. Users should consult qualified healthcare professionals for medical concerns.'],
  ['Limitation and applicable law', 'To the maximum extent permitted by applicable law, RADVORA is not liable for indirect, incidental, special, or consequential losses arising solely from website use. Nothing in these terms excludes rights or remedies that cannot legally be excluded, including mandatory consumer protections.'],
  ['Changes and contact', 'We may update these terms to reflect changes in products, services, law, or operations. Material changes will apply prospectively where required. Questions can be submitted through the Contact or Support page.'],
]

export default function TermsPage(){
  return <main className="page-shell"><div className="content-card prose-card"><p className="eyebrow">RADVORA TECHNOLOGIES · INDIA</p><h1>Terms of Service</h1><p>Last updated: 11 September 2026</p><p>These terms govern access to and use of the RADVORA Technologies website, accounts, ordering systems, products, and related customer services.</p>{sections.map(([title, body])=><section key={title}><h2>{title}</h2><p>{body}</p></section>)}</div></main>
}
