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
  data: CalendarField | undefined,
  configurationSettings: ConfigurationSettings
): CalendarFieldEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToEnterprise(data, configurationSettings)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(data.autoMaxHeight, configurationSettings),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth, configurationSettings),
    Высота: data.height,
    ВысотаВМесяцах: data.heightInMonths,
    КонецПериодаОтображения: data.endOfRepresentationPeriod,
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    НачалоПериодаОтображения: data.beginOfRepresentationPeriod,
    ОтображатьПанельМесяцев: exportBooleanToEnterprise(data.showMonthsPanel, configurationSettings),
    ОтображатьТекущуюДату: exportBooleanToEnterprise(data.showCurrentDate, configurationSettings),
    ПеремещениеПоКалендарю: exportBooleanToEnterprise(data.calendarNavigation, configurationSettings),
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
    РазрешитьНачалоПеретаскивания: exportBooleanToEnterprise(data.enableStartDrag, configurationSettings),
    РазрешитьПеретаскивание: exportBooleanToEnterprise(data.enableDrag, configurationSettings),
    Рамка: exportBorderToEnterprise(data.border, configurationSettings),
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch, configurationSettings),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch, configurationSettings),
    РежимВыделения: exportSystemEnumerationToEnterprise(
      data.selectionMode,
      SE.DateSelectionModeToEnterprise,
      configurationSettings
    ),
    ЦветРамки: exportColorToEnterprise(data.borderColor, configurationSettings),
    Ширина: data.width,
    ШиринаВМесяцах: data.widthInMonths,
    Шрифт: exportFontToEnterprise(data.font, configurationSettings),
    События: exportEventsToEnterprise(data.events, configurationSettings),
  })
}

registerMetadata("ExportToEnterprise", "CalendarField", exportCalendarFieldToEnterprise)
