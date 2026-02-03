import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { Predefined, PredefinedItems, PredefinedItemsXML, PredefinedXML } from "./types"

export const _exportPredefinedToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: Predefined | undefined
): PredefinedXML | undefined => {
  if (!data) return undefined

  return {
    Name: data.name,
    Code: data.code,
    Description: data.description,
    IsFolder: data.isFolder,
  }
}

export const _exportPredefinedItemsToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: PredefinedItems | undefined
): PredefinedItemsXML | undefined => {
  if (!data) return undefined

  return data.map((value) => _exportPredefinedToXML(context, undefined, _rule, value)!)
}
