import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormFieldFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import { TrackBarField, TrackBarFieldEnterprise } from "~/metadata/forms/elements/trackBarField/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { ImportFromEnterpriseReturn } from "../types"

const importTrackBarFieldEventsFromEnterprise = (
  data:
    | {
        ПриИзменении?: string
      }
    | undefined
):
  | {
      onChange?: string
    }
  | undefined => {
  if (!data) return undefined

  const result: {
    onChange?: string
  } = {}

  if (data.ПриИзменении !== undefined) result.onChange = data.ПриИзменении

  return Object.keys(result).length > 0 ? result : undefined
}

export const importTrackBarFieldFromEnterprise = <
  From extends TrackBarFieldEnterprise | undefined,
  Name extends string,
>(
  context: ConfigurationContext,
  data: From,
  name: Name
): ImportFromEnterpriseReturn<From, TrackBarField, Name> => {
  if (!data) return undefined as ImportFromEnterpriseReturn<From, TrackBarField, Name>

  const baseFields = importFormFieldFromEnterprise(context, data, name)!

  const result: ImportFromEnterpriseReturn<From, TrackBarField, Name> = {
    ...baseFields,
    elementType: FormElementType.TrackBarField,
  }

  const autoMaxHeight = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяВысота)
  if (autoMaxHeight !== undefined) result.autoMaxHeight = autoMaxHeight

  const autoMaxWidth = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяШирина)
  if (autoMaxWidth !== undefined) result.autoMaxWidth = autoMaxWidth

  if (data.БольшойШаг !== undefined) result.largeStep = data.БольшойШаг

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

  const markingAppearance = importSystemEnumerationFromEnterprise<SE.TrackBarMarkingAppearance>(
    context,
    data.ОтображениеРазметки,
    SE.TrackBarMarkingAppearanceFromEnterprise
  )
  if (markingAppearance !== undefined) result.markingAppearance = markingAppearance

  const verticalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоВертикали)
  if (verticalStretch !== undefined) result.verticalStretch = verticalStretch

  const horizontalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  if (data.Шаг !== undefined) result.step = data.Шаг

  if (data.ШагРазметки !== undefined) result.markingStep = data.ШагРазметки

  if (data.Ширина !== undefined) result.width = data.Ширина

  const events = importTrackBarFieldEventsFromEnterprise(data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportFromEnterprise", "TrackBarField", importTrackBarFieldFromEnterprise)
