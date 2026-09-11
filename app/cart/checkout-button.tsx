'use client'

export default function CheckoutButton({disabled=false}:{disabled?:boolean}){
  return <div><button className="pill light" type="button" disabled title="India checkout is being activated">India checkout — coming online</button><p className="status-message">UPI and Indian payment methods will be enabled after the production payment gateway is connected and verified. No Stripe checkout is used.</p></div>
}
