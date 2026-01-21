import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { TableChildItems, TableChildItemsXML } from "./types"

export const importTableChildItemsFromXML = (
  context: ConfigurationContext,
  xml: TableChildItemsXML | undefined
): TableChildItems => {
  if (!xml) return []

  const items = Array.isArray(xml) ? xml : [xml]

  return items.map((item) => {
    const elementType = Object.keys(item)[0] as FormElementType
    const importFunction = getOperationFunction("ImportFromXML", elementType)
    if (!importFunction) throw new Error(`ImportFromXML function not found for element type: ${elementType}`)
    return importFunction(context, item[elementType])!
  })
}
