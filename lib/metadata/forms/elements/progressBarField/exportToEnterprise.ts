import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import { ProgressBarField, ProgressBarFieldEnterprise } from "~/lib/metadata/forms/elements/progressBarField/types"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportProgressBarFieldToEnterprise = (
  data: ProgressBarField | undefined
): ProgressBarFieldEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToEnterprise(data)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth),
    ЦветРамки: exportColorToEnterprise(data.borderColor),
    Высота: data.height,
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальноеЗначение: data.maxValue,
    МаксимальнаяШирина: data.maxWidth,
    МинимальноеЗначение: data.minValue,
    Ориентация: exportSystemEnumerationToEnterprise(data.orientation, SE.FormItemOrientationToEnterprise),
    Отображение: exportSystemEnumerationToEnterprise(data.representation, SE.ProgressBarSmoothingModeToEnterprise),
    ОтображатьПроценты: exportBooleanToEnterprise(data.showPercent),
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch),
    Ширина: data.width,
    ПользовательскаяВидимость: exportUserVisibleToEnterprise(data.userVisible),
    Events: exportEventsToEnterprise(data.events),
  }
}

registerEnterpriseExport(FormElementType.ProgressBarField, exportProgressBarFieldToEnterprise)
