import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/lib/metadata/context/types"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import { TrackBarField, TrackBarFieldEnterprise } from "~/lib/metadata/forms/elements/trackBarField/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

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
