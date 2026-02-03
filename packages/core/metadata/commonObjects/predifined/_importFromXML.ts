import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { Predefined, PredefinedItems, PredefinedItemsXML, PredefinedXML } from "./types"

export const _importPredefinedFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: PredefinedXML | undefined
): Predefined | undefined => {
  if (!data) return undefined

  return {
    name: data.Name,
    code: data.Code,
    description: data.Description,
    isFolder: data.IsFolder,
  }
}

export const _importPredefinedItemsFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: PredefinedItemsXML | undefined
): PredefinedItems | undefined => {
  if (!data) return undefined

  return data.map((value) => _importPredefinedFromXML(context, undefined, _rule, value)!)
}
