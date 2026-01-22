import { ConfigurationContext } from "~/metadata/context/types"
import { importChildItemsFromXML } from "../childItems/importFromXML"
import { ChildItemsXML } from "../childItems/types"
import { CommandBarGroupChildItems, CommandBarGroupChildItemsXML } from "./types"

export const importCommandBarChildItemsFromXML = (
  context: ConfigurationContext,
  xml: CommandBarGroupChildItemsXML | undefined
): CommandBarGroupChildItems => {
  return importChildItemsFromXML(context, xml as ChildItemsXML) as CommandBarGroupChildItems
}
