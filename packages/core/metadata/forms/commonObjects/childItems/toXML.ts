import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { ElementXML, exportElementToXML, PropertyRule } from "~/metadata/orchestration"
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

    return { [item.itemType]: value } as Record<From["itemType"], ElementXML>
  })

  return result
}

const findReferenceElement = <From extends ChildItem>(
  data: From,
  referenceData: From[] | undefined
): From | undefined => {
  if (referenceData === undefined) return undefined
  return referenceData.find((referenceItem) => "name" in data && referenceItem.name === data.name)
}

registerTypeRule("GroupChildItems", "exportToXML", exportChildItemsToXML)
registerTypeRule("CommandBarChildItems", "exportToXML", exportChildItemsToXML)
registerTypeRule("TableChildItems", "exportToXML", exportChildItemsToXML)
registerTypeRule("PagesChildItems", "exportToXML", exportChildItemsToXML)
