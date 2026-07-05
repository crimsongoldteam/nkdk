import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"
import { Type } from "@sinclairtypebox"
import type { Static } from "@sinclairtypebox"
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

const UserVisibleRolesJSONSchema = Type.Record(Type.String(), BooleanJSONSchema, { minProperties: 1 })

export const UserVisibleJSONSchema = Type.Union(
  [
    Type.Object(
      {
        Разрешить: Type.Optional(Type.Literal("Ложь")),
        Роли: UserVisibleRolesJSONSchema,
      },
      { additionalProperties: false }
    ),
    Type.Object(
      {
        Разрешить: Type.Literal("Ложь"),
      },
      { additionalProperties: false }
    ),
  ],
  { additionalProperties: false }
)

export type UserVisibleYAML = Static<typeof UserVisibleJSONSchema>
export type UserVisibleRolesYAML = Static<typeof UserVisibleRolesJSONSchema>

export type UserVisibleKeysYAML = (typeof UserVisibleKeysYAML)[keyof typeof UserVisibleKeysYAML]

export type UserViewKeysYAML = (typeof UserViewKeysYAML)[keyof typeof UserViewKeysYAML]
export type UserEditKeysYAML = (typeof UserEditKeysYAML)[keyof typeof UserEditKeysYAML]
export type UserViewYAML = UserVisibleYAML
export type UserEditYAML = UserVisibleYAML

export interface UserVisibleWidePropertyRule extends WidePropertyRuleBase {
  type: "UserVisible"
}

export type UserVisibleRuleParams = Omit<UserVisibleWidePropertyRule, "type">

export function userVisibleRule<const Params extends UserVisibleRuleParams>(
  params: WideExactRuleParams<UserVisibleRuleParams, Params>
): Readonly<{ type: "UserVisible" } & Params> {
  return defineWidePropertyRule("UserVisible", params)
}
