import { ElementXML, exportElementToXML, PropertyRule } from "~/metadata/orchestration"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ChildItem } from "./types"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"

export const exportChildItemsToXML = <From extends ChildItem>(
  context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule,
  data: From[] | undefined
): Record<From["itemType"], ElementXML>[] | undefined => {
  if (!data || data.length === 0) return undefined

  const result = data.map((item) => {
    const value = exportElementToXML({
      context: context,
      element: item,
    })!

    return { [item.itemType]: value } as Record<From["itemType"], ElementXML>
  })

  return result
}

registerTypeRule("GroupChildItems", "exportToXML", exportChildItemsToXML)
registerTypeRule("CommandBarChildItems", "exportToXML", exportChildItemsToXML)
registerTypeRule("TableChildItems", "exportToXML", exportChildItemsToXML)
registerTypeRule("PagesChildItems", "exportToXML", exportChildItemsToXML)
