import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importElementFromXML } from "~/metadata/orchestration"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ElementXML } from "~/metadata/orchestration/formElement/types"
import { NamedElement } from "../../elements/baseElement/types"
import { PropertyRule } from "../../elements/calendarField/rules"
import { CommandBarChildItem, GroupChildItem, PagesChildItem, TableChildItem } from "./types"

export type XMLItem<From extends NamedElement> = Record<From["itemType"], ElementXML>

export const importChildItemsFromXML = <
  From extends GroupChildItem | CommandBarChildItem | TableChildItem | PagesChildItem,
>(
  context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: XMLItem<From>[] | XMLItem<From> | undefined
): From[] => {
  if (!xml) return []

  const items = Array.isArray(xml) ? xml : [xml]

  return items.map((item) => {
    const itemType = Object.keys(item)[0] as From["itemType"]
    const xmlValue = (item as Record<string, any>)[itemType]
    return importElementFromXML({
      context: context,
      itemType: itemType,
      xml: xmlValue,
      forReference: false,
    })!
  }) as From[]
}

registerTypeRule("GroupChildItems", "importFromXML", importChildItemsFromXML)
registerTypeRule("CommandBarChildItems", "importFromXML", importChildItemsFromXML)
registerTypeRule("TableChildItems", "importFromXML", importChildItemsFromXML)
registerTypeRule("PagesChildItems", "importFromXML", importChildItemsFromXML)
