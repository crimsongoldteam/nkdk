import {
  importI8nTextCombinedFromEnterprise,
  importI8nTextFromEnterprise,
} from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  ButtonGroup,
  ButtonGroupEnterprise,
  ButtonGroupPropsEnterprise,
} from "~/metadata/forms/elements/buttonGroup/types"
import { importFormGroupFromEnterprise } from "~/metadata/forms/elements/formGroup/importFromEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { importFormElementTypeFromEnterprise } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importButtonGroupChildItemsFromEnterprise } from "../../collections/buttonGroupChildItems/importFromEnterprise"

export const importButtonGroupChildFromEnterprise = (
  context: ConfigurationContext,
  data: ButtonGroupEnterprise
): ButtonGroup => {
  const props = importButtonGroupPropsFromEnterprise(context, data)

  const name = data.Имя
  const elementType = importFormElementTypeFromEnterprise(context, data.Тип)

  const result: ButtonGroup = {
    ...props,
    elementType,
    name,
    childItems: [],
  }

  const title = importI8nTextFromEnterprise(context, data.Заголовок)
  if (title !== undefined) result.title = title

  return result
}

export const importButtonGroupFromEnterprise = (
  context: ConfigurationContext,
  source: ButtonGroup | undefined,
  data: ButtonGroupPropsEnterprise | undefined
): ButtonGroup | undefined => {
  if (source === undefined) return undefined

  const props = importButtonGroupPropsFromEnterprise(context, data)
  const result: ButtonGroup = {
    ...source,
    ...props,
  }

  const title = importI8nTextCombinedFromEnterprise(context, source.title, data?.Заголовок)
  if (title !== undefined) result.title = title

  return result
}

const importButtonGroupPropsFromEnterprise = (
  context: ConfigurationContext,
  data: ButtonGroupEnterprise | ButtonGroupPropsEnterprise | undefined
): Omit<Partial<ButtonGroup>, "elementType" | "name"> => {
  const result: Omit<Partial<ButtonGroup>, "elementType" | "name"> = {
    childItems: [],
  }

  if (data === undefined) return result

  const baseFields = importFormGroupFromEnterprise(context, data, "Имя" in data ? data.Имя : "ButtonGroup")!

  if (baseFields) {
    const { elementType, name, ...formGroupProps } = baseFields
    Object.assign(result, formGroupProps)
  }

  const representation = importSystemEnumerationFromEnterprise<SE.ButtonGroupRepresentation>(
    context,
    data.Отображение,
    SE.ButtonGroupRepresentationFromEnterprise
  )
  if (representation !== undefined) result.representation = representation

  const userVisibleAllow = importUserVisibleFromEnterprise(
    context,
    data.РазрешитьИспользование,
    "РазрешитьИспользование"
  )
  const userVisibleDeny = importUserVisibleFromEnterprise(
    context,
    data.ЗапретитьИспользование,
    "ЗапретитьИспользование"
  )
  if (userVisibleAllow !== undefined || userVisibleDeny !== undefined) {
    result.userVisible = userVisibleAllow || userVisibleDeny
  }

  const childItems = importButtonGroupChildItemsFromEnterprise(context, data.ПодчиненныеЭлементы)
  if (childItems !== undefined) result.childItems = childItems

  return result
}

registerMetadata("ImportFromEnterprise", "ButtonGroup", importButtonGroupPropsFromEnterprise)
