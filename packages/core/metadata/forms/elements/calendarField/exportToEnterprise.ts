import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { CalendarField, CalendarFieldEnterprise } from "~/metadata/forms/elements/calendarField/types"
import { exportFormFieldToEnterprise } from "~/metadata/forms/elements/formField/exportToEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

const exportCalendarFieldEventsToEnterprise = (
  data:
    | {
        onChange?: string
        selection?: string
        dragStart?: string
        dragEnd?: string
        drag?: string
        onActivateDate?: string
        onPeriodOutput?: string
        dragCheck?: string
      }
    | undefined
):
  | {
      ПриИзменении?: string
      Выбор?: string
      НачалоПеретаскивания?: string
      ОкончаниеПеретаскивания?: string
      Перетаскивание?: string
      ПриАктивизацииДаты?: string
      ПриВыводеПериода?: string
      ПроверкаПеретаскивания?: string
    }
  | undefined => {
  if (!data) return undefined

  const result: {
    ПриИзменении?: string
    Выбор?: string
    НачалоПеретаскивания?: string
    ОкончаниеПеретаскивания?: string
    Перетаскивание?: string
    ПриАктивизацииДаты?: string
    ПриВыводеПериода?: string
    ПроверкаПеретаскивания?: string
  } = {}

  if (data.onChange !== undefined) result.ПриИзменении = data.onChange
  if (data.selection !== undefined) result.Выбор = data.selection
  if (data.dragStart !== undefined) result.НачалоПеретаскивания = data.dragStart
  if (data.dragEnd !== undefined) result.ОкончаниеПеретаскивания = data.dragEnd
  if (data.drag !== undefined) result.Перетаскивание = data.drag
  if (data.onActivateDate !== undefined) result.ПриАктивизацииДаты = data.onActivateDate
  if (data.onPeriodOutput !== undefined) result.ПриВыводеПериода = data.onPeriodOutput
  if (data.dragCheck !== undefined) result.ПроверкаПеретаскивания = data.dragCheck

  return Object.keys(result).length > 0 ? result : undefined
}

export const exportCalendarFieldToEnterprise = (
  context: ConfigurationContext,
  data: CalendarField | undefined
): CalendarFieldEnterprise | undefined => {
  if (!data) return undefined

  return {
    const baseFields = exportFormFieldToEnterprise(context, data)
  if (!baseFields) return undefined

  return {
    ...baseFields,,

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
    События: exportCalendarFieldEventsToEnterprise(data.events),  }
}

registerMetadata("ExportToEnterprise", "CalendarField", exportCalendarFieldToEnterprise)
