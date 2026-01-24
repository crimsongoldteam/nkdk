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
} as const

export const UserViewKeysEnterprise = {
  Allow: "РазрешитьПросмотр",
  Deny: "ЗапретитьПросмотр",
} as const

export const UserEditKeysEnterprise = {
  Allow: "РазрешитьРедактирование",
  Deny: "ЗапретитьРедактирование",
} as const

export type UserVisibleEnterprise = Record<string, StringboolEnterprise>

export type UserVisibleKeysEnterprise = (typeof UserVisibleKeysEnterprise)[keyof typeof UserVisibleKeysEnterprise]

export type UserViewKeysEnterprise = (typeof UserViewKeysEnterprise)[keyof typeof UserViewKeysEnterprise]
export type UserEditKeysEnterprise = (typeof UserEditKeysEnterprise)[keyof typeof UserEditKeysEnterprise]
export type UserViewEnterprise = Record<string, StringboolEnterprise>
export type UserEditEnterprise = Record<string, StringboolEnterprise>
