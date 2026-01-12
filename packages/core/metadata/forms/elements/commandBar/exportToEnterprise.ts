import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import {
  exportI8nTextOtherToEnterprise,
  exportI8nTextToEnterprise,
} from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  CommandBar,
  CommandBarPartialEnterprise,
  CommandBarTypedEnterprise,
} from "~/metadata/forms/elements/commandBar/types"
import { exportFormGroupPropsToEnterprise } from "~/metadata/forms/elements/formGroup/exportToEnterprise"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { exportButtonGroupChildItemsToEnterprise } from "../../collections/buttonGroupChildItems/exportToEnterprise"

export const exportCommandBarTypedToEnterprise = (
  context: ConfigurationContext,
  data: CommandBar | undefined
): CommandBarTypedEnterprise | undefined => {
  if (!data) return undefined

  const props = exportCommandBarPropsToEnterprise(context, data)

  const result: CommandBarTypedEnterprise = {
    Тип: "КоманднаяПанель",
    ...props,
  }

  const title = exportI8nTextToEnterprise(context, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result)
}

export const exportCommandBarPartialToEnterprise = (
  context: ConfigurationContext,
  data: CommandBar
): CommandBarPartialEnterprise => {
  const props = exportCommandBarPropsToEnterprise(context, data)

  const result: CommandBarPartialEnterprise = {
    ...props,
  }

  const title = exportI8nTextOtherToEnterprise(context, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result)
}

const exportCommandBarPropsToEnterprise = (
  context: ConfigurationContext,
  data: CommandBar
): CommandBarPartialEnterprise => {
  const baseFields = exportFormGroupPropsToEnterprise(context, data)

  const result: CommandBarPartialEnterprise = {
    ...baseFields,
  }

  const autofill = exportBooleanToEnterprise(context, data.autofill)
  if (autofill !== undefined) result.Автозаполнение = autofill

  const displayImportance = exportSystemEnumerationToEnterprise(
    context,
    data.displayImportance,
    SE.DisplayImportanceToEnterprise
  )
  if (displayImportance !== undefined) result.ВажностьПриОтображении = displayImportance

  const horizontalAlign = exportSystemEnumerationToEnterprise(
    context,
    data.horizontalAlign,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (horizontalAlign !== undefined) result.ГоризонтальноеПоложение = horizontalAlign

  const userVisible = exportUserVisibleToEnterprise(context, data.userVisible)
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const childItems = exportButtonGroupChildItemsToEnterprise(context, data.childItems)
  if (childItems !== undefined) result.ПодчиненныеЭлементы = childItems

  return result
}

registerMetadata("ExportPartialToEnterprise", "CommandBar", exportCommandBarPartialToEnterprise)
