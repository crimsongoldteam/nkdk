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
  rule: PropertyRule,
  xml: XMLItem<From>[] | XMLItem<From> | undefined
): From[] => {
  if (!xml) return []

  const items = Array.isArray(xml) ? xml : [xml]

  return items.map((item) => {
    const xmlTag = Object.keys(item)[0]
    const xmlRawValue = (item as Record<string, any>)[xmlTag]
    const itemType = resolveItemTypeFromXMLTag(rule, xmlTag, xmlRawValue) as From["itemType"]
    const xmlValue = (item as Record<string, any>)[itemType] ?? xmlRawValue
    return importElementFromXML({
      context: context,
      itemType: itemType,
      xml: xmlValue,
      forReference: false,
    })!
  }) as From[]
}

const resolveItemTypeFromXMLTag = (rule: PropertyRule, xmlTag: string, xmlValue?: any): string => {
  if (rule.type === "CommandBarChildItems" && xmlTag === "Button") {
    const type = xmlValue?.Type
    if (type === "CommandBarButton" || type === "CommandBarHyperlink") {
      return "CommandBarButton"
    }
    return "Button"
  }

  if (rule.type !== "TableChildItems") return xmlTag

  const tableXMLTagToItemType: Record<string, TableChildItem["itemType"]> = {
    CheckBoxField: "TableCheckBoxField",
    ColumnGroup: "ColumnGroup",
    InputField: "TableInputField",
    LabelField: "TableLabelField",
    PictureField: "TablePictureField",
  }

  return tableXMLTagToItemType[xmlTag] ?? xmlTag
}

registerTypeRule("GroupChildItems", "importFromXML", importChildItemsFromXML)
registerTypeRule("CommandBarChildItems", "importFromXML", importChildItemsFromXML)
registerTypeRule("TableChildItems", "importFromXML", importChildItemsFromXML)
registerTypeRule("PagesChildItems", "importFromXML", importChildItemsFromXML)
