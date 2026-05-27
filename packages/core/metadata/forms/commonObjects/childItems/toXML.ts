import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { restoreKnownDuplicateCommandBarButtonIds } from "~/metadata/forms/knownAnomalies"
import { ElementXML, exportElementToXML, PropertyRule } from "~/metadata/orchestration"
import { getElementXMLTagName } from "~/metadata/orchestration/formElement/ruleFactory"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ChildItem } from "./types"

export const exportChildItemsToXML = <From extends ChildItem>(
  context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule,
  data: From[] | undefined,
  referenceData?: From[]
): Record<From["itemType"], ElementXML>[] | undefined => {
  if (!data || data.length === 0) return undefined

  const result = data.map((item) => {
    const referenceElement = findReferenceElement(item, referenceData)
    const value = exportElementToXML({
      context: context,
      element: item,
      referenceElement: referenceElement,
    })!
    const xmlTag = getElementXMLTagName(item.itemType)

    return { [xmlTag]: value } as Record<From["itemType"], ElementXML>
  })

  return restoreKnownDuplicateCommandBarButtonIdsForXMLTags({
    currentXMLPath: context.exportToXML.context?.currentXMLPath,
    items: result,
  })
}

const findReferenceElement = <From extends ChildItem>(
  data: From,
  referenceData: From[] | undefined
): From | undefined => {
  if (referenceData === undefined) return undefined
  return referenceData.find((referenceItem) => "name" in data && referenceItem.name === data.name)
}

const restoreKnownDuplicateCommandBarButtonIdsForXMLTags = <From extends ChildItem>(params: {
  currentXMLPath: string | undefined
  items: Record<From["itemType"], ElementXML>[]
}): Record<From["itemType"], ElementXML>[] => {
  const commandBarItems = params.items.map((item) => {
    if (!("Button" in item)) return item
    return { CommandBarButton: item.Button }
  })

  const restoredItems = restoreKnownDuplicateCommandBarButtonIds({
    currentXMLPath: params.currentXMLPath,
    items: commandBarItems,
  })

  return restoredItems.map((item, index) => {
    if (!("CommandBarButton" in item)) return params.items[index]
    return { Button: item.CommandBarButton } as Record<From["itemType"], ElementXML>
  })
}

registerTypeRule("GroupChildItems", "exportToXML", exportChildItemsToXML)
registerTypeRule("CommandBarChildItems", "exportToXML", exportChildItemsToXML)
registerTypeRule("TableChildItems", "exportToXML", exportChildItemsToXML)
registerTypeRule("PagesChildItems", "exportToXML", exportChildItemsToXML)
