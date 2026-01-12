import {
  exportI8nTextOtherToEnterprise,
  exportI8nTextToEnterprise,
} from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  ButtonGroup,
  ButtonGroupEnterprise,
  ButtonGroupPropsEnterprise,
} from "~/metadata/forms/elements/buttonGroup/types"
import { exportFormGroupToEnterprise } from "~/metadata/forms/elements/formGroup/exportToEnterprise"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { exportButtonGroupChildItemsToEnterprise } from "../../collections/buttonGroupChildItems/exportToEnterprise"

export const exportButtonGroupChildToEnterprise = (
  context: ConfigurationContext,
  data: ButtonGroup | undefined
): ButtonGroupEnterprise | undefined => {
  if (!data) return undefined

  const props = exportButtonGroupPropsToEnterprise(context, data)

  const result: ButtonGroupEnterprise = {
    Тип: "ГруппаКнопок",
    Имя: data.name,
    ...props,
  }

  const title = exportI8nTextToEnterprise(context, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result)
}

export const exportButtonGroupToEnterprise = (
  context: ConfigurationContext,
  data: ButtonGroup
): ButtonGroupEnterprise => {
  const props = exportButtonGroupPropsToEnterprise(context, data)

  const result: ButtonGroupEnterprise = {
    Тип: "ГруппаКнопок",
    Имя: data.name,
    ...props,
  }

  const title = exportI8nTextOtherToEnterprise(context, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result)
}

const exportButtonGroupPropsToEnterprise = (
  context: ConfigurationContext,
  data: ButtonGroup
): ButtonGroupPropsEnterprise => {
  const baseFields = exportFormGroupToEnterprise(context, data)

  const result: ButtonGroupPropsEnterprise = {
    ...baseFields,
  }

  const representation = exportSystemEnumerationToEnterprise(
    context,
    data.representation,
    SE.ButtonGroupRepresentationToEnterprise
  )
  if (representation !== undefined) result.Отображение = representation

  const userVisible = exportUserVisibleToEnterprise(context, data.userVisible)
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const childItems = exportButtonGroupChildItemsToEnterprise(context, data.childItems)
  if (childItems !== undefined) result.ПодчиненныеЭлементы = childItems

  return result
}

registerMetadata("ExportToEnterprise", "ButtonGroup", exportButtonGroupToEnterprise)
