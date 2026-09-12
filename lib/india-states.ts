export const INDIA_STATES = [
  ['01','Jammu and Kashmir'],['02','Himachal Pradesh'],['03','Punjab'],['04','Chandigarh'],['05','Uttarakhand'],['06','Haryana'],['07','Delhi'],['08','Rajasthan'],['09','Uttar Pradesh'],['10','Bihar'],['11','Sikkim'],['12','Arunachal Pradesh'],['13','Nagaland'],['14','Manipur'],['15','Mizoram'],['16','Tripura'],['17','Meghalaya'],['18','Assam'],['19','West Bengal'],['20','Jharkhand'],['21','Odisha'],['22','Chhattisgarh'],['23','Madhya Pradesh'],['24','Gujarat'],['26','Dadra and Nagar Haveli and Daman and Diu'],['27','Maharashtra'],['29','Karnataka'],['30','Goa'],['31','Lakshadweep'],['32','Kerala'],['33','Tamil Nadu'],['34','Puducherry'],['35','Andaman and Nicobar Islands'],['36','Telangana'],['37','Andhra Pradesh'],['38','Ladakh'],['97','Other Territory'],
] as const

export type IndiaStateCode=(typeof INDIA_STATES)[number][0]

const STATE_BY_CODE=new Map<string,string>(INDIA_STATES)
const CODE_BY_STATE=new Map<string,string>(INDIA_STATES.map(([code,name])=>[name.toLowerCase(),code]))

export function indiaStateName(code:string){return STATE_BY_CODE.get(code)||null}
export function indiaStateCode(name:string){return CODE_BY_STATE.get(name.trim().toLowerCase())||null}
export function validIndiaState(code:string,name?:string){
  const canonical=indiaStateName(code)
  return Boolean(canonical&&(!name||canonical.toLowerCase()===name.trim().toLowerCase()))
}
