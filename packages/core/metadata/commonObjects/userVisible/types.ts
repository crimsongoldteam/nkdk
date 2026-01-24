import { StringboolEnterprise } from "../boolean/types"

export interface UserVisibleItemXML {
  _name: string
  "#text": boolean
}

export type UserVisibleXML = {
  "xr:Common"?: boolean
  "xr:Value"?: UserVisibleItemXML[]
}

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
  AllowView: "РазрешитьПросмотр",
  DenyView: "ЗапретитьПросмотр",
  AllowEdit: "РазрешитьРедактирование",
  DenyEdit: "ЗапретитьРедактирование",
} as const

export type UserVisibleKeysEnterprise = (typeof UserVisibleKeysEnterprise)[keyof typeof UserVisibleKeysEnterprise]

export type UserVisibleEnterprise = Record<string, StringboolEnterprise>
