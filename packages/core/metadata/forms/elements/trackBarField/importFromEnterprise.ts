import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import {
  importI8nTextCombinedFromEnterprise,
  importI8nTextFromEnterprise,
} from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormFieldPropsFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import { FormFieldEnterprise } from "~/metadata/forms/elements/formField/types"
import {
  TrackBarField,
  TrackBarFieldPartialEnterprise,
  TrackBarFieldTypedEnterprise,
} from "~/metadata/forms/elements/trackBarField/types"
import { importEventsFromEnterprise } from "~/metadata/forms/events/importFromEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  importFormElementTypeFromEnterprise,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { ImportExportReturn } from "../types"

export function importTrackBarFieldTypedFromEnterprise<To extends TrackBarField | undefined>(
  context: ConfigurationContext,
  data: ToTypedEnterpriseType<To>,
  name: string
): ImportExportReturn<ToTypedEnterpriseType<To>, To> {
  if (data === undefined) return undefined

  const props = importTrackBarFieldPropsFromEnterprise(context, data, name)

  const elementType = importFormElementTypeFromEnterprise(context, data.Тип)

  const result: TrackBarField = {
    ...props,
    elementType,
    name,
  }

  const title = importI8nTextFromEnterprise(context, data.Заголовок)
  if (title !== undefined) result.title = title

  return result as ImportExportReturn<ToTypedEnterpriseType<To>, To>
}

export function importTrackBarFieldPartialFromEnterprise<To extends TrackBarField>(
  context: ConfigurationContext,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  const props = importTrackBarFieldPropsFromEnterprise(
    context,
    data as ToPartialEnterpriseType<To> | undefined,
    source.name
  )
  const result: To = {
    ...source,
    ...props,
  }

  const title = importI8nTextCombinedFromEnterprise(context, source.title, data?.Заголовок)
  if (title !== undefined) result.title = title

  return result
}

const importTrackBarFieldPropsFromEnterprise = (
  context: ConfigurationContext,
  data: TrackBarFieldTypedEnterprise | TrackBarFieldPartialEnterprise | undefined,
  name: string
): Omit<Partial<TrackBarField>, "elementType" | "name"> => {
  const result: Omit<Partial<TrackBarField>, "elementType" | "name"> = {}

  const baseProps = importFormFieldPropsFromEnterprise(context, (data ?? {}) as FormFieldEnterprise, name)
  Object.assign(result, baseProps)

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

  if (data.Шаг !== undefined) result.step = data.Шаг

  if (data.ШагРазметки !== undefined) result.markingStep = data.ШагРазметки

  if (data.Ширина !== undefined) result.width = data.Ширина

  const events = importEventsFromEnterprise(context, data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportPartialFromEnterprise", "TrackBarField", importTrackBarFieldPropsFromEnterprise)
