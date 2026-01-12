import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormFieldFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import {
  TrackBarField,
  TrackBarFieldPartialEnterprise,
  TrackBarFieldTypedEnterprise,
} from "~/metadata/forms/elements/trackBarField/types"
import { importEventsFromEnterprise } from "~/metadata/forms/events/importFromEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { importFormElementTypeFromEnterprise } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const importTrackBarFieldTypedFromEnterprise = (
  context: ConfigurationContext,
  data: TrackBarFieldTypedEnterprise | undefined,
  name: string
): TrackBarField | undefined => {
  if (data === undefined) return undefined

  const baseFields = importFormFieldFromEnterprise(context, data, name)!

  const props = importTrackBarFieldPropsFromEnterprise(context, data)

  const elementType = importFormElementTypeFromEnterprise(context, data.Тип)

  const result: TrackBarField = {
    ...baseFields,
    ...props,
    elementType,
  }

  return result
}

export const importTrackBarFieldPartialFromEnterprise = (
  context: ConfigurationContext,
  source: TrackBarField | undefined,
  data: TrackBarFieldPartialEnterprise | undefined
): TrackBarField | undefined => {
  if (source === undefined) return undefined

  const baseFields = importFormFieldFromEnterprise(context, data, source.name)!

  const props = importTrackBarFieldPropsFromEnterprise(context, data)
  const result: TrackBarField = {
    ...source,
    ...baseFields,
    ...props,
  }

  return result
}

const importTrackBarFieldPropsFromEnterprise = (
  context: ConfigurationContext,
  data: TrackBarFieldTypedEnterprise | TrackBarFieldPartialEnterprise | undefined
): Omit<Partial<TrackBarField>, "elementType" | "name"> => {
  const result: Omit<Partial<TrackBarField>, "elementType" | "name"> = {}

  if (data === undefined) return result

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

  const events = importEventsFromEnterprise(context, data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportFromEnterprise", "TrackBarField", importTrackBarFieldPropsFromEnterprise)
