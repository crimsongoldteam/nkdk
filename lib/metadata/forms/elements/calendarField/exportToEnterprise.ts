import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/lib/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { CalendarField, CalendarFieldEnterprise } from "~/lib/metadata/forms/elements/calendarField/types"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportCalendarFieldToEnterprise = (
  data: CalendarField | undefined
): CalendarFieldEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToEnterprise(data)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth),
    НачалоПериодаОтображения: data.beginOfRepresentationPeriod,
    Рамка: exportBorderToEnterprise(data.border),
    ЦветРамки: exportColorToEnterprise(data.borderColor),
    ПеремещениеПоКалендарю: exportBooleanToEnterprise(data.calendarNavigation),
    РазрешитьПеретаскивание: exportBooleanToEnterprise(data.enableDrag),
    РазрешитьНачалоПеретаскивания: exportBooleanToEnterprise(data.enableStartDrag),
    КонецПериодаОтображения: data.endOfRepresentationPeriod,
    Шрифт: exportFontToEnterprise(data.font),
    Высота: data.height,
    ВысотаВМесяцах: data.heightInMonths,
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    РежимВыделения: exportSystemEnumerationToEnterprise(data.selectionMode, SE.DateSelectionModeToEnterprise),
    ОтображатьТекущуюДату: exportBooleanToEnterprise(data.showCurrentDate),
    ОтображатьПанельМесяцев: exportBooleanToEnterprise(data.showMonthsPanel),
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch),
    Ширина: data.width,
    ШиринаВМесяцах: data.widthInMonths,
    ПользовательскаяВидимость: exportUserVisibleToEnterprise(data.userVisible),
    Events: exportEventsToEnterprise(data.events),
  }
}

registerEnterpriseExport(FormElementType.CalendarField, exportCalendarFieldToEnterprise)
