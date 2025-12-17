import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import { TrackBarField, TrackBarFieldEnterprise } from "~/lib/metadata/forms/elements/trackBarField/types"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportTrackBarFieldToEnterprise = (
  data: TrackBarField | undefined
): TrackBarFieldEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToEnterprise(data)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth),
    Высота: data.height,
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch),
    БольшойШаг: data.largeStep,
    ОтображениеРазметки: exportSystemEnumerationToEnterprise(
      data.markingAppearance,
      SE.TrackBarMarkingAppearanceToEnterprise
    ),
    ШагРазметки: data.markingStep,
    МаксимальнаяВысота: data.maxHeight,
    МаксимальноеЗначение: data.maxValue,
    МаксимальнаяШирина: data.maxWidth,
    МинимальноеЗначение: data.minValue,
    Ориентация: exportSystemEnumerationToEnterprise(data.orientation, SE.FormItemOrientationToEnterprise),
    Шаг: data.step,
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch),
    Ширина: data.width,
    ПользовательскаяВидимость: exportUserVisibleToEnterprise(data.userVisible),
    Events: exportEventsToEnterprise(data.events),
  }
}

registerEnterpriseExport(FormElementType.TrackBarField, exportTrackBarFieldToEnterprise)
