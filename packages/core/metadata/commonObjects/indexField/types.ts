import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"
import { Type } from "typebox"
import type { Static } from "typebox"

export type IndexField = string

// XML-структура: <IndexedFields><Field>name1</Field><Field>name2</Field></IndexedFields>
// После парсинга: { Field: "name1" } или { Field: ["name1", "name2"] }
export interface IndexFieldsXML {
  Field?: string | string[]
}

export const IndexFieldJSONSchema = Type.String()
export type IndexFieldYAML = Static<typeof IndexFieldJSONSchema>

export type IndexFields = IndexField[]
export type IndexFieldsYAML = IndexFieldYAML[]

export interface IndexFieldWidePropertyRule extends WidePropertyRuleBase {
  type: "IndexField"
}

export type IndexFieldRuleParams = Omit<IndexFieldWidePropertyRule, "type">

export function indexFieldRule<const Params extends IndexFieldRuleParams>(
  params: WideExactRuleParams<IndexFieldRuleParams, Params>
): Readonly<{ type: "IndexField" } & Params> {
  return defineWidePropertyRule("IndexField", params)
}
