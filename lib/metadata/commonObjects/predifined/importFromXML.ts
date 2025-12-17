import { Predefined, PredefinedItems, PredefinedItemsXML, PredefinedXML } from "./types"

export const importPredefinedFromXML = (data: PredefinedXML | undefined): Predefined | undefined => {
  if (!data) return undefined

  return {
    name: data.Name,
    code: data.Code,
    description: data.Description,
    isFolder: data.IsFolder,
  }
}

export const importPredefinedItemsFromXML = (data: PredefinedItemsXML | undefined): PredefinedItems | undefined => {
  if (!data) return undefined

  return data.map((value) => importPredefinedFromXML(value)!)
}
