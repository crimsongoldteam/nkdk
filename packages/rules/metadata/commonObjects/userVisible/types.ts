import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "@nkdk/runtime/rule-kit"
import { Type } from "typebox"
import type { Static } from "typebox"
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

const USER_VISIBLE_ROLE_KEY_PATTERN = "^[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_]*$"
const USER_VISIBLE_ROLE_OR_UUID_KEY_PATTERN = "^(?:[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_]*|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$"

function createUserVisibleJSONSchema(roleKeyPattern: string) {
  const roles = Type.Record(
    Type.String({ pattern: roleKeyPattern }),
    BooleanJSONSchema,
    { minProperties: 1, additionalProperties: false },
  )
  return Type.Union(
  [
    Type.Object(
      {
        Разрешить: Type.Optional(Type.Literal("Ложь")),
        Роли: roles,
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
  )
}

export const UserVisibleJSONSchema = createUserVisibleJSONSchema(USER_VISIBLE_ROLE_KEY_PATTERN)
export const UserVisibleBrokenReferenceJSONSchema = createUserVisibleJSONSchema(
  USER_VISIBLE_ROLE_OR_UUID_KEY_PATTERN,
)

export type UserVisibleYAML = Static<typeof UserVisibleJSONSchema>
export type UserVisibleRolesYAML = Record<string, Static<typeof BooleanJSONSchema>>

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
