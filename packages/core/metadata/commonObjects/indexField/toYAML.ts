import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"
import { IndexField, IndexFieldYAML, IndexFields, IndexFieldsYAML } from "./types"

export const exportIndexFieldToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: IndexField | undefined
): IndexFieldYAML | undefined => {
  if (!data) return undefined

  return data
}

export const exportIndexFieldsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: IndexFields | undefined
): IndexFieldsYAML | undefined => {
  if (!data) return undefined

  return data.map((item) => exportIndexFieldToYAML(context, undefined, item)!)
}

registerTypeRule("IndexField", "exportToYAML", exportIndexFieldsToYAML)
