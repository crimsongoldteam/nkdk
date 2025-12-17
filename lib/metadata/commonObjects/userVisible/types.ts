import { StringboolEnterprise } from "../boolean/types"

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

export const UserVisibleKeysEnterprise = {
  Allow: "РазрешитьИспользование",
  Deny: "ЗапретитьИспользование",
} as const

export type UserVisibleKeysEnterprise = (typeof UserVisibleKeysEnterprise)[keyof typeof UserVisibleKeysEnterprise]

export type UserVisibleEnterprise = Record<string, StringboolEnterprise>
