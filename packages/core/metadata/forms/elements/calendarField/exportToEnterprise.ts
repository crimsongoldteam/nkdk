import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { CalendarField, CalendarFieldEnterprise } from "~/metadata/forms/elements/calendarField/types"
import { exportFormFieldToEnterprise } from "~/metadata/forms/elements/formField/exportToEnterprise"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportCalendarFieldToEnterprise = (
  context: ConfigurationContext,
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
