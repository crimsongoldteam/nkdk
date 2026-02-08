import { ConfigurationContext } from "~/metadata/context/types"
import { ElementXML, PropertyRule } from "~/metadata/metadataFactory"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { AllChildItem } from "./types"

export const exportChildItemsToXML = <From extends AllChildItem>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: From[] | undefined
): Record<From["elementType"], ElementXML>[] | undefined => {
  if (!data || data.length === 0) return undefined

  const result: Record<From["elementType"], ElementXML>[] = []
  for (const item of data) {
    const exportFunction = getOperationFunction("ExportToXML", item.elementType)
    if (!exportFunction) throw new Error(`ExportToXML function not found for element type: ${item.elementType}`)
    const value = exportFunction(context, item)
    result.push({ [item.elementType]: value } as Record<From["elementType"], ElementXML>)
  }

  return result
}

registerTypeRule("ChildItems", "exportToXML", exportChildItemsToXML as any)
