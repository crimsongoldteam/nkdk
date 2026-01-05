import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/metadata/context/types"
import { exportFormFieldToEnterprise } from "~/metadata/forms/elements/formField/exportToEnterprise"
import { TrackBarField, TrackBarFieldEnterprise } from "~/metadata/forms/elements/trackBarField/types"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportTrackBarFieldToEnterprise = (
  context: Context,
  data: TrackBarField | undefined
): TrackBarFieldEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToEnterprise(context, data)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(context, data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(context, data.autoMaxWidth),
    БольшойШаг: data.largeStep,
    Высота: data.height,
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    МаксимальноеЗначение: data.maxValue,
    МинимальноеЗначение: data.minValue,
    Ориентация: exportSystemEnumerationToEnterprise(context, data.orientation, SE.FormItemOrientationToEnterprise),
    ОтображениеРазметки: exportSystemEnumerationToEnterprise(
      context,
      data.markingAppearance,
      SE.TrackBarMarkingAppearanceToEnterprise
    ),
    ...exportUserVisibleToEnterprise(context, data.userVisible),
    РастягиватьПоВертикали: exportBooleanToEnterprise(context, data.verticalStretch),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(context, data.horizontalStretch),
    Шаг: data.step,
    ШагРазметки: data.markingStep,
    Ширина: data.width,
    События: exportEventsToEnterprise(context, data.events),
  })
}

registerMetadata("ExportToEnterprise", "TrackBarField", exportTrackBarFieldToEnterprise)
