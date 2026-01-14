import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import {
  importI8nTextCombinedFromEnterprise,
  importI8nTextFromEnterprise,
} from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importPictureFromEnterprise } from "~/metadata/commonObjects/picture/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormGroupPropsFromEnterprise } from "~/metadata/forms/elements/formGroup/importFromEnterprise"
import { Popup, PopupPartialEnterprise, PopupTypedEnterprise } from "~/metadata/forms/elements/popup/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  importFormElementTypeFromEnterprise,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importButtonGroupChildItemsFromEnterprise } from "../../collections/buttonGroupChildItems/importFromEnterprise"

export function importPopupTypedFromEnterprise<To extends Popup | undefined>(
  context: ConfigurationContext,
  data: ToTypedEnterpriseType<To>,
  name: string
): To {
  if (data === undefined) return undefined as To

  const baseProps = importFormGroupPropsFromEnterprise(context, data)
  const props = importPopupPropsFromEnterprise(context, data)

  const elementType = importFormElementTypeFromEnterprise(context, data.Тип)

  const result: Popup = {
    ...baseProps,
    ...props,
    elementType,
    name,
    childItems: props.childItems ?? [],
  }

  const title = importI8nTextFromEnterprise(context, data.Заголовок)
  if (title !== undefined) result.title = title

  return result as To
}

export function importPopupPartialFromEnterprise<To extends Popup>(
  context: ConfigurationContext,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  const baseProps = importFormGroupPropsFromEnterprise(context, data)
  const props = importPopupPropsFromEnterprise(context, data)
  const result: To = {
    ...source,
    ...baseProps,
    ...props,
    childItems: props.childItems ?? [],
  }

  const title = importI8nTextCombinedFromEnterprise(context, source.title, data?.Заголовок)
  if (title !== undefined) result.title = title

  return result
}

const importPopupPropsFromEnterprise = (
  context: ConfigurationContext,
  data: PopupTypedEnterprise | PopupPartialEnterprise | undefined
): Omit<Partial<Popup>, "elementType" | "name"> => {
  const result: Omit<Partial<Popup>, "elementType" | "name"> = {
    childItems: [],
  }

  if (data === undefined) return result

  const picture = importPictureFromEnterprise(context, data.Картинка)
  if (picture !== undefined) result.picture = picture

  const representation = importSystemEnumerationFromEnterprise<SE.ButtonRepresentation>(
    context,
    data.Отображение,
    SE.ButtonRepresentationFromEnterprise
  )
  if (representation !== undefined) result.representation = representation

  const shapeRepresentation = importSystemEnumerationFromEnterprise<SE.ButtonShapeRepresentation>(
    context,
    data.ОтображениеФигуры,
    SE.ButtonShapeRepresentationFromEnterprise
  )
  if (shapeRepresentation !== undefined) result.shapeRepresentation = shapeRepresentation

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

  const shape = importSystemEnumerationFromEnterprise<SE.ButtonShape>(
    context,
    data.Фигура,
    SE.ButtonShapeFromEnterprise
  )
  if (shape !== undefined) result.shape = shape

  const borderColor = importColorFromEnterprise(context, data.ЦветРамки)
  if (borderColor !== undefined) result.borderColor = borderColor

  const backColor = importColorFromEnterprise(context, data.ЦветФона)
  if (backColor !== undefined) result.backColor = backColor

  const childItems = importButtonGroupChildItemsFromEnterprise(context, data.ПодчиненныеЭлементы)
  if (childItems !== undefined) result.childItems = childItems

  return result
}

registerMetadata("ImportPartialFromEnterprise", "Popup", importPopupPropsFromEnterprise)
