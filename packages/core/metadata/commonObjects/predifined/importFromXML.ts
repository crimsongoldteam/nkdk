import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { Predefined, PredefinedItems, PredefinedItemsXML, PredefinedXML } from "./types"

export const importPredefinedFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any>,
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

export const importPredefinedItemsFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: PredefinedItemsXML | undefined
): PredefinedItems | undefined => {
  if (!data) return undefined

  return data.map((value) => importPredefinedFromXML(context, undefined, value)!)
}
