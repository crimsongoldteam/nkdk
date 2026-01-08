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

  const baseFields = exportFormFieldToEnterprise(context, data)

  const result: CalendarFieldEnterprise = {
    ...baseFields,
  }

  const autoMaxHeight = exportBooleanToEnterprise(context, data.autoMaxHeight)
  if (autoMaxHeight !== undefined) result.АвтоМаксимальнаяВысота = autoMaxHeight

  const autoMaxWidth = exportBooleanToEnterprise(context, data.autoMaxWidth)
  if (autoMaxWidth !== undefined) result.АвтоМаксимальнаяШирина = autoMaxWidth

  if (data.height !== undefined) result.Высота = data.height

  if (data.heightInMonths !== undefined) result.ВысотаВМесяцах = data.heightInMonths

  if (data.endOfRepresentationPeriod !== undefined) result.КонецПериодаОтображения = data.endOfRepresentationPeriod

  if (data.maxHeight !== undefined) result.МаксимальнаяВысота = data.maxHeight

  if (data.maxWidth !== undefined) result.МаксимальнаяШирина = data.maxWidth

  if (data.beginOfRepresentationPeriod !== undefined) result.НачалоПериодаОтображения = data.beginOfRepresentationPeriod

  const showMonthsPanel = exportBooleanToEnterprise(context, data.showMonthsPanel)
  if (showMonthsPanel !== undefined) result.ОтображатьПанельМесяцев = showMonthsPanel

  const showCurrentDate = exportBooleanToEnterprise(context, data.showCurrentDate)
  if (showCurrentDate !== undefined) result.ОтображатьТекущуюДату = showCurrentDate

  const calendarNavigation = exportBooleanToEnterprise(context, data.calendarNavigation)
  if (calendarNavigation !== undefined) result.ПеремещениеПоКалендарю = calendarNavigation

  const enableStartDrag = exportBooleanToEnterprise(context, data.enableStartDrag)
  if (enableStartDrag !== undefined) result.РазрешитьНачалоПеретаскивания = enableStartDrag

  const enableDrag = exportBooleanToEnterprise(context, data.enableDrag)
  if (enableDrag !== undefined) result.РазрешитьПеретаскивание = enableDrag

  const border = exportBorderToEnterprise(context, data.border)
  if (border !== undefined) result.Рамка = border

  const verticalStretch = exportBooleanToEnterprise(context, data.verticalStretch)
  if (verticalStretch !== undefined) result.РастягиватьПоВертикали = verticalStretch

  const horizontalStretch = exportBooleanToEnterprise(context, data.horizontalStretch)
  if (horizontalStretch !== undefined) result.РастягиватьПоГоризонтали = horizontalStretch

  const selectionMode = exportSystemEnumerationToEnterprise(
    context,
    data.selectionMode,
    SE.DateSelectionModeToEnterprise
  )
  if (selectionMode !== undefined) result.РежимВыделения = selectionMode

  const borderColor = exportColorToEnterprise(context, data.borderColor)
  if (borderColor !== undefined) result.ЦветРамки = borderColor

  if (data.width !== undefined) result.Ширина = data.width

  if (data.widthInMonths !== undefined) result.ШиринаВМесяцах = data.widthInMonths

  const font = exportFontToEnterprise(context, data.font)
  if (font !== undefined) result.Шрифт = font

  const events = exportCalendarFieldEventsToEnterprise(data.events)
  if (events !== undefined) result.События = events

  return result
}

registerMetadata("ExportToEnterprise", "CalendarField", exportCalendarFieldToEnterprise)
