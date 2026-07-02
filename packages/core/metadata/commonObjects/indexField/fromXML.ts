import type { PropertyRule } from "../../orchestration/property/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { ConfigurationContextFromXML } from "../../context/types"
import type { IndexFields, IndexFieldsXML } from "./types"

export const importIndexFieldsFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: IndexFieldsXML | undefined
): IndexFields | undefined => {
  if (!xml) return undefined
  const fields = xml.Field
  if (fields === undefined) return []
  return Array.isArray(fields) ? fields : [fields]
}

registerTypeRule("IndexField", "importFromXML", importIndexFieldsFromXML)
