import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { ButtonGroupChildItems, ButtonGroupChildItemsXML } from "./types"

export const importButtonGroupChildItemsFromXML = (
  context: ConfigurationContext,
  xml: ButtonGroupChildItemsXML | undefined
): ButtonGroupChildItems | undefined => {
  if (!xml) return undefined

  const items = Array.isArray(xml) ? xml : [xml]

  return items.map((item) => {
    const elementType = Object.keys(item)[0] as FormElementType
    const importFunction = getOperationFunction("ImportFromXML", elementType)
    if (!importFunction) throw new Error(`Import function not found for element type: ${elementType}`)
    return importFunction(context, item[elementType])!
  })
}
