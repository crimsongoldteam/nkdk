import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormFieldToEnterprise } from "~/metadata/forms/elements/formField/exportToEnterprise"
import {
  TrackBarField,
  TrackBarFieldPartialEnterprise,
  TrackBarFieldTypedEnterprise,
} from "~/metadata/forms/elements/trackBarField/types"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportTrackBarFieldTypedToEnterprise = (
  context: ConfigurationContext,
  data: TrackBarField | undefined
): TrackBarFieldTypedEnterprise | undefined => {
  if (!data) return undefined

  const baseFields = exportFormFieldToEnterprise(context, data)

  const props = exportTrackBarFieldPropsToEnterprise(context, data)

  const result: TrackBarFieldTypedEnterprise = {
    Тип: "ПолеПолосыПрокрутки",
    ...baseFields,
    ...props,
  }

  return sortObject(result)
}

export const exportTrackBarFieldPartialToEnterprise = (
  context: ConfigurationContext,
  data: TrackBarField
): TrackBarFieldPartialEnterprise => {
  const baseFields = exportFormFieldToEnterprise(context, data)

  const props = exportTrackBarFieldPropsToEnterprise(context, data)

  const result: TrackBarFieldPartialEnterprise = {
    ...baseFields,
    ...props,
  }

  return sortObject(result)
}

const exportTrackBarFieldPropsToEnterprise = (
  context: ConfigurationContext,
  data: TrackBarField
): TrackBarFieldPartialEnterprise => {
  const result: TrackBarFieldPartialEnterprise = {}

  const autoMaxHeight = exportBooleanToEnterprise(context, data.autoMaxHeight)
  if (autoMaxHeight !== undefined) result.АвтоМаксимальнаяВысота = autoMaxHeight

  const autoMaxWidth = exportBooleanToEnterprise(context, data.autoMaxWidth)
  if (autoMaxWidth !== undefined) result.АвтоМаксимальнаяШирина = autoMaxWidth

  if (data.largeStep !== undefined) result.БольшойШаг = data.largeStep

  if (data.height !== undefined) result.Высота = data.height

  if (data.maxHeight !== undefined) result.МаксимальнаяВысота = data.maxHeight

  if (data.maxWidth !== undefined) result.МаксимальнаяШирина = data.maxWidth

  if (data.maxValue !== undefined) result.МаксимальноеЗначение = data.maxValue

  if (data.minValue !== undefined) result.МинимальноеЗначение = data.minValue

  const orientation = exportSystemEnumerationToEnterprise(context, data.orientation, SE.FormItemOrientationToEnterprise)
  if (orientation !== undefined) result.Ориентация = orientation

  const markingAppearance = exportSystemEnumerationToEnterprise(
    context,
    data.markingAppearance,
    SE.TrackBarMarkingAppearanceToEnterprise
  )
  if (markingAppearance !== undefined) result.ОтображениеРазметки = markingAppearance

  const userVisible = exportUserVisibleToEnterprise(context, data.userVisible)
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const verticalStretch = exportBooleanToEnterprise(context, data.verticalStretch)
  if (verticalStretch !== undefined) result.РастягиватьПоВертикали = verticalStretch

  const horizontalStretch = exportBooleanToEnterprise(context, data.horizontalStretch)
  if (horizontalStretch !== undefined) result.РастягиватьПоГоризонтали = horizontalStretch

  if (data.step !== undefined) result.Шаг = data.step

  if (data.markingStep !== undefined) result.ШагРазметки = data.markingStep

  if (data.width !== undefined) result.Ширина = data.width

  const events = exportEventsToEnterprise(context, data.events)
  if (events !== undefined) result.События = events

  return result
}

registerMetadata("ExportPartialToEnterprise", "TrackBarField", exportTrackBarFieldPartialToEnterprise)
registerMetadata("ExportTypedToEnterprise", "TrackBarField", exportTrackBarFieldTypedToEnterprise)
