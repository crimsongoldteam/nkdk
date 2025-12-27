import { Context } from "~/packages/core/metadata/context/types"
import { getOperationFunction } from "~/packages/core/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/packages/core/metadata/metadataFactory/types"
import { ChildItems, ChildItemsXML } from "./types"

export const importChildItemsFromXML = (context: Context, xml: ChildItemsXML | undefined): ChildItems => {
  if (!xml) return []

  const result: ChildItems = []
  for (const item of xml) {
    const elementType = Object.keys(item)[0] as FormElementType
    const importFunction = getOperationFunction("ImportFromXML", elementType)
    if (!importFunction) throw new Error(`Import function not found for element type: ${elementType}`)

    result.push(importFunction(context, item[elementType])!)
  }

  return result
}
