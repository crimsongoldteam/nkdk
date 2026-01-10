import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importBorderFromEnterprise } from "~/metadata/commonObjects/border/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importFontFromEnterprise } from "~/metadata/commonObjects/font/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { CalendarField, CalendarFieldEnterprise } from "~/metadata/forms/elements/calendarField/types"
import { importFormFieldFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import { ImportFromEnterpriseReturn } from "~/metadata/forms/elements/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const importCalendarFieldFromEnterprise = <
  T extends CalendarFieldEnterprise | undefined,
  N extends string | undefined,
>(
  context: ConfigurationContext,
  data: T,
  name: N
): ImportFromEnterpriseReturn<T, CalendarField, N> => {
  if (!data) return undefined as ImportFromEnterpriseReturn<T, CalendarField, N>

  const baseFields = importFormFieldFromEnterprise(context, data, name)!
  const { elementType: _, ...restFields } = baseFields

  const result: CalendarField = {
    elementType: FormElementType.CalendarField,
    ...restFields,
  }

  const autoMaxHeight = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяВысота)
  if (autoMaxHeight !== undefined) result.autoMaxHeight = autoMaxHeight

  const autoMaxWidth = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяШирина)
  if (autoMaxWidth !== undefined) result.autoMaxWidth = autoMaxWidth

  if (data.Высота !== undefined) result.height = data.Высота

  if (data.ВысотаВМесяцах !== undefined) result.heightInMonths = data.ВысотаВМесяцах

  if (data.КонецПериодаОтображения !== undefined) result.endOfRepresentationPeriod = data.КонецПериодаОтображения

  if (data.МаксимальнаяВысота !== undefined) result.maxHeight = data.МаксимальнаяВысота

  if (data.МаксимальнаяШирина !== undefined) result.maxWidth = data.МаксимальнаяШирина

  if (data.НачалоПериодаОтображения !== undefined) result.beginOfRepresentationPeriod = data.НачалоПериодаОтображения

  const showMonthsPanel = importBooleanFromEnterprise(context, data.ОтображатьПанельМесяцев)
  if (showMonthsPanel !== undefined) result.showMonthsPanel = showMonthsPanel

  const showCurrentDate = importBooleanFromEnterprise(context, data.ОтображатьТекущуюДату)
  if (showCurrentDate !== undefined) result.showCurrentDate = showCurrentDate

  const calendarNavigation = importBooleanFromEnterprise(context, data.ПеремещениеПоКалендарю)
  if (calendarNavigation !== undefined) result.calendarNavigation = calendarNavigation

  const userVisibleAllow = importUserVisibleFromEnterprise(
    context,
    data.РазрешитьИспользование,
    "РазрешитьИспользование"
  )
  const userVisibleDeny = importUserVisibleFromEnterprise(
    context,
    data.ЗапретитьИспользование,
    "ЗапретитьИспользование"
  )
  if (userVisibleAllow !== undefined || userVisibleDeny !== undefined) {
    result.userVisible = userVisibleAllow || userVisibleDeny
  }

  const enableStartDrag = importBooleanFromEnterprise(context, data.РазрешитьНачалоПеретаскивания)
  if (enableStartDrag !== undefined) result.enableStartDrag = enableStartDrag

  const enableDrag = importBooleanFromEnterprise(context, data.РазрешитьПеретаскивание)
  if (enableDrag !== undefined) result.enableDrag = enableDrag

  const border = importBorderFromEnterprise(context, data.Рамка)
  if (border !== undefined) result.border = border

  const verticalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоВертикали)
  if (verticalStretch !== undefined) result.verticalStretch = verticalStretch

  const horizontalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  const selectionMode = importSystemEnumerationFromEnterprise<SE.DateSelectionMode>(
    context,
    data.РежимВыделения,
    SE.DateSelectionModeFromEnterprise
  )
  if (selectionMode !== undefined) result.selectionMode = selectionMode

  const borderColor = importColorFromEnterprise(context, data.ЦветРамки)
  if (borderColor !== undefined) result.borderColor = borderColor

  if (data.Ширина !== undefined) result.width = data.Ширина

  if (data.ШиринаВМесяцах !== undefined) result.widthInMonths = data.ШиринаВМесяцах

  const font = importFontFromEnterprise(context, data.Шрифт)
  if (font !== undefined) result.font = font

  const events = importCalendarFieldEventsFromEnterprise(data.События)
  if (events !== undefined) result.events = events

  return result as ImportFromEnterpriseReturn<T, CalendarField, N>
}

const importCalendarFieldEventsFromEnterprise = (
  data:
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
    | undefined
):
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
  | undefined => {
  if (!data) return undefined

  const result: {
    onChange?: string
    selection?: string
    dragStart?: string
    dragEnd?: string
    drag?: string
    onActivateDate?: string
    onPeriodOutput?: string
    dragCheck?: string
  } = {}

  if (data.ПриИзменении !== undefined) result.onChange = data.ПриИзменении
  if (data.Выбор !== undefined) result.selection = data.Выбор
  if (data.НачалоПеретаскивания !== undefined) result.dragStart = data.НачалоПеретаскивания
  if (data.ОкончаниеПеретаскивания !== undefined) result.dragEnd = data.ОкончаниеПеретаскивания
  if (data.Перетаскивание !== undefined) result.drag = data.Перетаскивание
  if (data.ПриАктивизацииДаты !== undefined) result.onActivateDate = data.ПриАктивизацииДаты
  if (data.ПриВыводеПериода !== undefined) result.onPeriodOutput = data.ПриВыводеПериода
  if (data.ПроверкаПеретаскивания !== undefined) result.dragCheck = data.ПроверкаПеретаскивания

  return Object.keys(result).length > 0 ? result : undefined
}

registerMetadata("ImportFromEnterprise", "CalendarField", importCalendarFieldFromEnterprise)
