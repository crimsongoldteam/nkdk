import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { IndexField, IndexFieldYAML, IndexFields, IndexFieldsYAML } from "./types"

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

registerTypeRule("IndexField", "importFromYAML", importIndexFieldsFromYAML)
