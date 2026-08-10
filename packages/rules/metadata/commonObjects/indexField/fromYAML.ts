import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext } from "@nkdk/runtime"
import type { IndexField, IndexFieldYAML, IndexFields, IndexFieldsYAML } from "./types"

export const importIndexFieldFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: IndexFieldYAML | undefined
): IndexField | undefined => {
  if (!data) return undefined

  return data
}

export const importIndexFieldsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: IndexFieldsYAML | undefined
): IndexFields | undefined => {
  if (!data) return undefined

  return data
    .map((item) => importIndexFieldFromYAML(context, undefined, item)!)
    .filter((item): item is IndexField => item !== undefined)
}

export const metadataPropertyRule000 = definePropertyTypeRule("IndexField", "importFromYAML", importIndexFieldsFromYAML)
