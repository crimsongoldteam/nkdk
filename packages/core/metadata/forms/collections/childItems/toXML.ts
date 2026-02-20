import { ConfigurationContext } from "~/metadata/context/types"
import { ElementXML, exportElementToXML, PropertyRule } from "~/metadata/metadataFactory"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { mockContext } from "~/tests/mockContext"
import { AllChildItem } from "./types"

export const exportChildItemsToXML = <From extends AllChildItem>(
  _context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: From[] | undefined
): Record<From["itemType"], ElementXML>[] | undefined => {
  if (!data || data.length === 0) return undefined

  const result = data.map((item) => {
    const value = exportElementToXML({
      context: mockContext,
      element: item,
    })!

    return { [item.itemType]: value } as Record<From["itemType"], ElementXML>
  })

  return result
}

registerTypeRule("ChildItems", "exportToXML", exportChildItemsToXML as any)
