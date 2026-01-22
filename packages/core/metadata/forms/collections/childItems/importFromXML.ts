import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType, ToXMLType } from "~/metadata/metadataFactory/types"
import { AllChildItem } from "./types"

export const importChildItemsFromXML = <From extends AllChildItem>(
  context: ConfigurationContext,
  xml: Record<From["elementType"], ToXMLType<From>>[] | Record<From["elementType"], ToXMLType<From>> | undefined
): From[] => {
  if (!xml) return []

  const items = Array.isArray(xml) ? xml : [xml]

  return items.map((item) => {
    const elementType = Object.keys(item)[0] as FormElementType
    const importFunction = getOperationFunction("ImportFromXML", elementType)
    if (!importFunction) throw new Error(`ImportFromXML function not found for element type: ${elementType}`)

    const itemResult = (item as Record<string, any>)[elementType]
    return importFunction(context, itemResult)! as From
  })
}
