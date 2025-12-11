import { TBoolEnterprise } from "../boolean/types"

export interface UserVisibleItemXML {
  _name: string
  "#text": boolean
}

export interface UserVisibleXMLItem {
  "xr:Common"?: boolean
  "xr:Value"?: UserVisibleItemXML
}

export type UserVisibleXML = UserVisibleXMLItem[]

export interface UserVisibleValue {
  name: string
  value: boolean
}

export interface UserVisible {
  common: boolean
  values: UserVisibleValue[]
}

export interface UserVisibleEnterprise {
  РазрешитьИспользование?: Record<string, TBoolEnterprise>
  ЗапретитьИспользование?: Record<string, TBoolEnterprise>
}
