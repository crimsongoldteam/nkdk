import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/lib/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { CalendarField, CalendarFieldEnterprise } from "~/lib/metadata/forms/elements/calendarField/types"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportCalendarFieldToEnterprise = (
  data: CalendarField | undefined,
  configurationSettings: ConfigurationSettings
): CalendarFieldEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToEnterprise(data, configurationSettings)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(data.autoMaxHeight, configurationSettings),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth, configurationSettings),
    НачалоПериодаОтображения: data.beginOfRepresentationPeriod,
    Рамка: exportBorderToEnterprise(data.border, configurationSettings),
    ЦветРамки: exportColorToEnterprise(data.borderColor, configurationSettings),
    ПеремещениеПоКалендарю: exportBooleanToEnterprise(data.calendarNavigation, configurationSettings),
    РазрешитьПеретаскивание: exportBooleanToEnterprise(data.enableDrag, configurationSettings),
    РазрешитьНачалоПеретаскивания: exportBooleanToEnterprise(data.enableStartDrag, configurationSettings),
    КонецПериодаОтображения: data.endOfRepresentationPeriod,
    Шрифт: exportFontToEnterprise(data.font, configurationSettings),
    Высота: data.height,
    ВысотаВМесяцах: data.heightInMonths,
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch, configurationSettings),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    РежимВыделения: exportSystemEnumerationToEnterprise(
      data.selectionMode,
      SE.DateSelectionModeToEnterprise,
      configurationSettings
    ),
    ОтображатьТекущуюДату: exportBooleanToEnterprise(data.showCurrentDate, configurationSettings),
    ОтображатьПанельМесяцев: exportBooleanToEnterprise(data.showMonthsPanel, configurationSettings),
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch, configurationSettings),
    Ширина: data.width,
    ШиринаВМесяцах: data.widthInMonths,
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
    Events: exportEventsToEnterprise(data.events, configurationSettings),
  }
}

registerEnterpriseExport(FormElementType.CalendarField, exportCalendarFieldToEnterprise)
