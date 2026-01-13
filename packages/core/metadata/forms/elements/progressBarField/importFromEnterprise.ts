import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormFieldFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import {
  ProgressBarField,
  ProgressBarFieldPartialEnterprise,
  ProgressBarFieldTypedEnterprise,
} from "~/metadata/forms/elements/progressBarField/types"
import { importEventsFromEnterprise } from "~/metadata/forms/events/importFromEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { importFormElementTypeFromEnterprise } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const importProgressBarFieldTypedFromEnterprise = (
  context: ConfigurationContext,
  data: ProgressBarFieldTypedEnterprise | undefined,
  name: string
): ProgressBarField | undefined => {
  if (data === undefined) return undefined

  const baseFields = importFormFieldFromEnterprise(context, data, name)!

  const props = importProgressBarFieldPropsFromEnterprise(context, data)

  const elementType = importFormElementTypeFromEnterprise(context, data.Тип)

  const result: ProgressBarField = {
    ...baseFields,
    ...props,
    elementType,
  }

  return result
}

export const importProgressBarFieldPartialFromEnterprise = (
  context: ConfigurationContext,
  source: ProgressBarField | undefined,
  data: ProgressBarFieldPartialEnterprise | undefined
): ProgressBarField | undefined => {
  if (source === undefined) return undefined

  const baseFields = importFormFieldFromEnterprise(context, data, source.name)!

  const props = importProgressBarFieldPropsFromEnterprise(context, data)
  const result: ProgressBarField = {
    ...source,
    ...baseFields,
    ...props,
    elementType: source.elementType, // Сохраняем elementType из source
  }

  return result
}

const importProgressBarFieldPropsFromEnterprise = (
  context: ConfigurationContext,
  data: ProgressBarFieldTypedEnterprise | ProgressBarFieldPartialEnterprise | undefined
): Omit<Partial<ProgressBarField>, "elementType" | "name"> => {
  const result: Omit<Partial<ProgressBarField>, "elementType" | "name"> = {}

  if (data === undefined) return result

  const autoMaxHeight = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяВысота)
  if (autoMaxHeight !== undefined) result.autoMaxHeight = autoMaxHeight

  const autoMaxWidth = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяШирина)
  if (autoMaxWidth !== undefined) result.autoMaxWidth = autoMaxWidth

  if (data.Высота !== undefined) result.height = data.Высота

  if (data.МаксимальнаяВысота !== undefined) result.maxHeight = data.МаксимальнаяВысота

  if (data.МаксимальнаяШирина !== undefined) result.maxWidth = data.МаксимальнаяШирина

  if (data.МаксимальноеЗначение !== undefined) result.maxValue = data.МаксимальноеЗначение

  if (data.МинимальноеЗначение !== undefined) result.minValue = data.МинимальноеЗначение

  const orientation = importSystemEnumerationFromEnterprise<SE.FormItemOrientation>(
    context,
    data.Ориентация,
    SE.FormItemOrientationFromEnterprise
  )
  if (orientation !== undefined) result.orientation = orientation

  const showPercent = importBooleanFromEnterprise(context, data.ОтображатьПроценты)
  if (showPercent !== undefined) result.showPercent = showPercent

  const representation = importSystemEnumerationFromEnterprise<SE.ProgressBarSmoothingMode>(
    context,
    data.Отображение,
    SE.ProgressBarSmoothingModeFromEnterprise
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

  const verticalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоВертикали)
  if (verticalStretch !== undefined) result.verticalStretch = verticalStretch

  const horizontalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  const borderColor = importColorFromEnterprise(context, data.ЦветРамки)
  if (borderColor !== undefined) result.borderColor = borderColor

  if (data.Ширина !== undefined) result.width = data.Ширина

  const events = importEventsFromEnterprise(context, data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportPartialFromEnterprise", "ProgressBarField", importProgressBarFieldPropsFromEnterprise)
