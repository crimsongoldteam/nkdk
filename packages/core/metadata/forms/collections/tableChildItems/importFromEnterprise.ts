import { ConfigurationContext } from "~/metadata/context/types"
import { importChildItemsPartialFromEnterprise } from "../childItems/importFromEnterprise"
import { ChildItems } from "../childItems/types"
import { TableChildItems } from "./types"

export const importTableChildItemsFromEnterprise = (
  context: ConfigurationContext,
  items: ChildItems
): TableChildItems => {
  return importChildItemsPartialFromEnterprise(context, items) as TableChildItems
}
