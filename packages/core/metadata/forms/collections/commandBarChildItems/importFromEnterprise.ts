import { ConfigurationContext } from "~/metadata/context/types"
import {
  importChildItemsPartialFromEnterprise,
  importChildItemsTypedFromEnterprise,
} from "../childItems/importFromEnterprise"
import { ChildItems } from "../childItems/types"
import { CommandBarChildItems, CommandBarChildItemsTypedEnterprise } from "./types"

export const importCommandBarChildItemsPartialFromEnterprise = (
  context: ConfigurationContext,
  items: ChildItems
): CommandBarChildItems => {
  return importChildItemsPartialFromEnterprise(context, items) as CommandBarChildItems
}

export const importCommandBarChildItemsTypedFromEnterprise = (
  context: ConfigurationContext,
  items: CommandBarChildItemsTypedEnterprise | undefined
): CommandBarChildItems => {
  return importChildItemsTypedFromEnterprise(context, items) as CommandBarChildItems
}
