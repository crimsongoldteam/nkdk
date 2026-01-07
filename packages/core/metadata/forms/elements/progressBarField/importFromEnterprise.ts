import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { ProgressBarField, ProgressBarFieldEnterprise } from "~/metadata/forms/elements/progressBarField/types"
import { importFormFieldFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

const importProgressBarFieldEventsFromEnterprise = (
  data: {
    ПриИзменении?: string
  } | undefined
): {
  onChange?: string
} | undefined => {
  if (!data) return undefined

  const result: {
    onChange?: string
  } = {}

  if (data.ПриИзменении !== undefined) result.onChange = data.ПриИзменении

  return Object.keys(result).length > 0 ? result : undefined
}

export const importProgressBarFieldFromEnterprise = (
  context: ConfigurationContext,
  data: ProgressBarFieldEnterprise | undefined,
  name: string
): ProgressBarField | undefined => {
  if (!data) return undefined

  const baseFields = importFormFieldFromEnterprise(context, data, name)!
  const { elementType: _, ...restFields } = baseFields

  const result: ProgressBarField = {
    elementType: FormElementType.ProgressBarField,
    ...restFields,
  }

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
  const userVisibleDeny = importUserVisibleFromEnterprise(context, data.ЗапретитьИспользование, "ЗапретитьИспользование")
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

  const events = importProgressBarFieldEventsFromEnterprise(data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportFromEnterprise", "ProgressBarField", importProgressBarFieldFromEnterprise)
