import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { ChildItems, ChildItemsXML } from "./types"

export const importChildItemsFromXML = (
  context: ConfigurationContext,
  xml: ChildItemsXML | undefined
): ChildItems | undefined => {
  if (!xml) return undefined

  const items = Array.isArray(xml) ? xml : [xml]

  return items.map((item) => {
    const elementType = Object.keys(item)[0] as FormElementType
    const importFunction = getOperationFunction("ImportFromXML", elementType)
    if (!importFunction) throw new Error(`Import function not found for element type: ${elementType}`)
    return importFunction(context, item[elementType])!
  })
}
