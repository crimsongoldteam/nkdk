import { Static, Type } from "@sinclair/typebox"
import { BooleanJSONSchema, StringboolXML } from "../boolean/types"

export interface UserVisibleItemXML {
  _name: string
  "#text": StringboolXML
}

export type UserVisibleXML = {
  "xr:Common"?: StringboolXML
  "xr:Value"?: UserVisibleItemXML[] | UserVisibleItemXML
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
  Value: "Использование",
} as const

export const UserViewKeysYAML = {
  Value: "Просмотр",
} as const

export const UserEditKeysYAML = {
  Value: "Редактирование",
} as const

export const UserVisibleJSONSchema = Type.Object(
  {
    Разрешить: Type.Optional(Type.Literal("Ложь")),
    Роли: Type.Record(Type.String(), BooleanJSONSchema, { minProperties: 1 }),
  },
  { additionalProperties: false }
)

export type UserVisibleYAML = Static<typeof UserVisibleJSONSchema>

export type UserVisibleKeysYAML = (typeof UserVisibleKeysYAML)[keyof typeof UserVisibleKeysYAML]

export type UserViewKeysYAML = (typeof UserViewKeysYAML)[keyof typeof UserViewKeysYAML]
export type UserEditKeysYAML = (typeof UserEditKeysYAML)[keyof typeof UserEditKeysYAML]
export type UserViewYAML = UserVisibleYAML
export type UserEditYAML = UserVisibleYAML
