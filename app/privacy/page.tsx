import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How RADVORA Technologies handles personal information across its website, accounts, orders, support, and warranty workflows.'
}

const sections = [
  ['Information we collect', 'We may collect information you provide directly, such as your name, email address, phone number, delivery information, account details, order information, support requests, warranty submissions, and business enquiries. We may also receive limited technical and transaction information from service providers used to operate the website and process payments.'],
  ['How we use information', 'We use personal information to operate accounts, process and fulfil orders, provide support, administer warranty requests, respond to enquiries, maintain security, prevent fraud or abuse, comply with legal obligations, and improve the reliability of our services.'],
  ['Payments', 'Payment card details are handled by our payment processor. RADVORA does not intend to store full payment card numbers or card security codes on its own application database. Payment and checkout providers may process information under their own privacy terms.'],
  ['Service providers', 'We may use vetted providers for hosting, authentication, payments, email, analytics, logistics, fraud prevention, and customer support. We share only the information reasonably necessary for those providers to perform their services.'],
  ['Retention', 'We retain information only for as long as reasonably necessary for the purposes described in this policy, including order fulfilment, warranty administration, security, dispute handling, accounting, and legal compliance.'],
  ['Your choices', 'Depending on applicable law, you may have rights to request access, correction, deletion, restriction, or other controls over personal information. Some records may need to be retained where required for legal, tax, fraud-prevention, warranty, or transaction purposes.'],
  ['Security', 'We use administrative and technical controls designed to protect personal information. No internet service can guarantee absolute security, so users should also protect their account credentials and report suspected misuse promptly.'],
  ['Children', 'RADVORA services are not directed to children for independent commercial transactions. Where applicable, a parent, guardian, or authorized adult should manage purchases and account activity.'],
  ['International processing', 'Our providers may process information in locations other than your own. Where applicable, we rely on appropriate contractual, legal, or technical safeguards for such processing.'],
  ['Contact', 'Privacy questions or requests can be submitted through the RADVORA Contact or Support page. We may need to verify identity before acting on certain requests.'],
]

export default function PrivacyPage(){
  return <main className="page-shell"><div className="content-card prose-card"><p className="eyebrow">RADVORA TECHNOLOGIES</p><h1>Privacy Policy</h1><p>Last updated: 11 September 2026</p><p>This policy explains how RADVORA Technologies handles personal information when you use our website, create an account, place an order, request support or warranty service, or contact us for business purposes.</p>{sections.map(([title, body])=><section key={title}><h2>{title}</h2><p>{body}</p></section>)}</div></main>
}
