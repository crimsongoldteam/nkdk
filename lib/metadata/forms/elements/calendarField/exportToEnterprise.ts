import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/lib/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { CalendarField, CalendarFieldEnterprise } from "~/lib/metadata/forms/elements/calendarField/types"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportCalendarFieldToEnterprise = (
  configurationSettings: ConfigurationSettings, data: CalendarField | undefined
): CalendarFieldEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToEnterprise(configurationSettings, data)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(configurationSettings, data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(configurationSettings, data.autoMaxWidth),
    Высота: data.height,
    ВысотаВМесяцах: data.heightInMonths,
    КонецПериодаОтображения: data.endOfRepresentationPeriod,
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    НачалоПериодаОтображения: data.beginOfRepresentationPeriod,
    ОтображатьПанельМесяцев: exportBooleanToEnterprise(configurationSettings, data.showMonthsPanel),
    ОтображатьТекущуюДату: exportBooleanToEnterprise(configurationSettings, data.showCurrentDate),
    ПеремещениеПоКалендарю: exportBooleanToEnterprise(configurationSettings, data.calendarNavigation),
    ...exportUserVisibleToEnterprise(configurationSettings, data.userVisible),
    РазрешитьНачалоПеретаскивания: exportBooleanToEnterprise(configurationSettings, data.enableStartDrag),
    РазрешитьПеретаскивание: exportBooleanToEnterprise(configurationSettings, data.enableDrag),
    Рамка: exportBorderToEnterprise(configurationSettings, data.border),
    РастягиватьПоВертикали: exportBooleanToEnterprise(configurationSettings, data.verticalStretch),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(configurationSettings, data.horizontalStretch),
    РежимВыделения: exportSystemEnumerationToEnterprise(configurationSettings, data.selectionMode, SE.DateSelectionModeToEnterprise),
    ЦветРамки: exportColorToEnterprise(configurationSettings, data.borderColor),
    Ширина: data.width,
    ШиринаВМесяцах: data.widthInMonths,
    Шрифт: exportFontToEnterprise(configurationSettings, data.font),
    События: exportEventsToEnterprise(configurationSettings, data.events),
  })
}

registerMetadata("ExportToEnterprise", "CalendarField", exportCalendarFieldToEnterprise)
