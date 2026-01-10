import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { ContextMenu, ContextMenuEnterprise } from "~/metadata/forms/elements/contextMenu/types"
import { ImportFromEnterpriseReturn } from "~/metadata/forms/elements/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importChildItemsFromEnterprise } from "../childItems/importFromEnterprise"

export function importContextMenuFromEnterprise<T extends ContextMenuEnterprise | undefined>(
  context: ConfigurationContext,
  data: T
): ImportFromEnterpriseReturn<T, ContextMenu, string> {
  if (data === undefined) return undefined as ImportFromEnterpriseReturn<T, ContextMenu, string>

  const result: ContextMenu = {
    name: data.Имя,
    elementType: FormElementType.FormGroup,
  }

  const displayImportance = importSystemEnumerationFromEnterprise(
    context,
    data.ВажностьПриОтображении,
    SE.DisplayImportanceFromEnterprise
  )
  if (displayImportance !== undefined) result.displayImportance = displayImportance

  const autofill = importBooleanFromEnterprise(context, data.Автозаполнение)
  if (autofill !== undefined) result.autofill = autofill

  const childItems = importChildItemsFromEnterprise(context, data.ПодчиненныеЭлементы)
  if (childItems !== undefined) result.childItems = childItems

  return result as ImportFromEnterpriseReturn<T, ContextMenu, string>
}
