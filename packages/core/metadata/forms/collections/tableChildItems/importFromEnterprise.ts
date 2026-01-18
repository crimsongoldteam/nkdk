import { ConfigurationContext } from "~/metadata/context/types"
import { importChildItemsFromEnterprise } from "../childItems/importFromEnterprise"
import { ChildItems } from "../childItems/types"
import { TableChildItems } from "./types"

export const importTableChildItemsFromEnterprise = (
  context: ConfigurationContext,
  items: ChildItems
): TableChildItems => {
  return importChildItemsFromEnterprise(context, items) as TableChildItems
}
