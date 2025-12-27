import { exportBooleanToEnterprise } from "~/packages/core/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/packages/core/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/packages/core/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/packages/core/metadata/commonObjects/font/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/packages/core/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/packages/core/metadata/context/types"
import { CalendarField, CalendarFieldEnterprise } from "~/packages/core/metadata/forms/elements/calendarField/types"
import { exportFormFieldToEnterprise } from "~/packages/core/metadata/forms/elements/formField/exportToEnterprise"
import { exportEventsToEnterprise } from "~/packages/core/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/packages/core/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/packages/core/metadata/systemEnumerations/types"

export const exportCalendarFieldToEnterprise = (
  context: Context,
  data: CalendarField | undefined
): CalendarFieldEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToEnterprise(context, data)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(context, data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(context, data.autoMaxWidth),
    Высота: data.height,
    ВысотаВМесяцах: data.heightInMonths,
    КонецПериодаОтображения: data.endOfRepresentationPeriod,
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    НачалоПериодаОтображения: data.beginOfRepresentationPeriod,
    ОтображатьПанельМесяцев: exportBooleanToEnterprise(context, data.showMonthsPanel),
    ОтображатьТекущуюДату: exportBooleanToEnterprise(context, data.showCurrentDate),
    ПеремещениеПоКалендарю: exportBooleanToEnterprise(context, data.calendarNavigation),
    ...exportUserVisibleToEnterprise(context, data.userVisible),
    РазрешитьНачалоПеретаскивания: exportBooleanToEnterprise(context, data.enableStartDrag),
    РазрешитьПеретаскивание: exportBooleanToEnterprise(context, data.enableDrag),
    Рамка: exportBorderToEnterprise(context, data.border),
    РастягиватьПоВертикали: exportBooleanToEnterprise(context, data.verticalStretch),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(context, data.horizontalStretch),
    РежимВыделения: exportSystemEnumerationToEnterprise(context, data.selectionMode, SE.DateSelectionModeToEnterprise),
    ЦветРамки: exportColorToEnterprise(context, data.borderColor),
    Ширина: data.width,
    ШиринаВМесяцах: data.widthInMonths,
    Шрифт: exportFontToEnterprise(context, data.font),
    События: exportEventsToEnterprise(context, data.events),
  })
}

registerMetadata("ExportToEnterprise", "CalendarField", exportCalendarFieldToEnterprise)
