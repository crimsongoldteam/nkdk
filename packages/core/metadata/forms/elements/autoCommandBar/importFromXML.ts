import { importBooleanFromXML } from "~/metadata/commonObjects/boolean/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { AutoCommandBar } from "~/metadata/forms/elements/autoCommandBar/types"
import { registerTypeRule } from "~/metadata/metadataFactory"
import { importChildItemsFromXML } from "../../collections/childItems/importFromXML"
import { CommandBarChildItem } from "../../collections/childItems/types"
import { PropertyRule } from "../calendarField/rules"
import { isHasContent } from "./helper"

export const importAutoCommandBarFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: any
): AutoCommandBar | undefined => {
  const autofill = importBooleanFromXML(context, undefined, xml.Autofill) ?? true
  const childItems = importChildItemsFromXML<CommandBarChildItem>(context, undefined, xml.ChildItems)

  const result: AutoCommandBar = {
    childItems: childItems,
    autofill: autofill,
  }

  if (xml._DisplayImportance !== undefined) result.displayImportance = xml._DisplayImportance

  if (xml.HorizontalAlign !== undefined) result.horizontalAlign = xml.HorizontalAlign

  if (!isHasContent(result)) return undefined

  return result
}

registerTypeRule("AutoCommandBar", "importFromEnterprise", importAutoCommandBarFromXML as any)
registerTypeRule("TableAutoCommandBar", "importFromEnterprise", importAutoCommandBarFromXML as any)
