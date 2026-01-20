import { ConfigurationContext } from "~/metadata/context/types"
import {
  importChildItemsPartialFromEnterprise,
  importChildItemsTypedFromEnterprise,
} from "../childItems/importFromEnterprise"
import { TableChildItems, TableChildItemsTypedEnterprise } from "./types"

export const importTableChildItemsPartialFromEnterprise = (
  context: ConfigurationContext,
  items: TableChildItems
): TableChildItems => {
  return importChildItemsPartialFromEnterprise(context, items)
}

export const importTableChildItemsTypedFromEnterprise = (
  context: ConfigurationContext,
  items: TableChildItemsTypedEnterprise
): TableChildItems => {
  return importChildItemsTypedFromEnterprise(context, items)
}
