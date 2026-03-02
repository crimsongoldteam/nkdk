import { Static, Type } from "@sinclair/typebox"
import { BooleanJSONSchema, StringboolYAML } from "../boolean/types"

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

export const UserVisibleKeysYAML = {
  Allow: "РазрешитьИспользование",
  Deny: "ЗапретитьИспользование",
} as const

export const UserViewKeysYAML = {
  Allow: "РазрешитьПросмотр",
  Deny: "ЗапретитьПросмотр",
} as const

export const UserEditKeysYAML = {
  Allow: "РазрешитьРедактирование",
  Deny: "ЗапретитьРедактирование",
} as const

export const UserVisibleJSONSchema = Type.Record(Type.String(), BooleanJSONSchema)

export type UserVisibleYAML = Static<typeof UserVisibleJSONSchema>

export type UserVisibleKeysYAML = (typeof UserVisibleKeysYAML)[keyof typeof UserVisibleKeysYAML]

export type UserViewKeysYAML = (typeof UserViewKeysYAML)[keyof typeof UserViewKeysYAML]
export type UserEditKeysYAML = (typeof UserEditKeysYAML)[keyof typeof UserEditKeysYAML]
export type UserViewYAML = Record<string, StringboolYAML>
export type UserEditYAML = Record<string, StringboolYAML>
