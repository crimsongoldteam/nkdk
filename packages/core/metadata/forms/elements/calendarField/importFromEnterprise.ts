import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importBorderFromEnterprise } from "~/metadata/commonObjects/border/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importFontFromEnterprise } from "~/metadata/commonObjects/font/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  CalendarField,
  CalendarFieldPartialEnterprise,
  CalendarFieldTypedEnterprise,
} from "~/metadata/forms/elements/calendarField/types"
import { importFormFieldFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import { importEventsFromEnterprise } from "~/metadata/forms/events/importFromEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  importFormElementTypeFromEnterprise,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export function importCalendarFieldTypedFromEnterprise<To extends CalendarField | undefined>(
  context: ConfigurationContext,
  data: ToTypedEnterpriseType<To>,
  name: string
): To {
  if (data === undefined) return undefined as To

  const baseFields = importFormFieldFromEnterprise(context, data, name)!

  const props = importCalendarFieldPropsFromEnterprise(context, data)

  const elementType = importFormElementTypeFromEnterprise(context, data.Тип)

  const result: CalendarField = {
    ...baseFields,
    ...props,
    elementType,
  }

  return result as To
}

export function importCalendarFieldPartialFromEnterprise<To extends CalendarField>(
  context: ConfigurationContext,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  const baseFields = importFormFieldFromEnterprise(context, data, source.name)!

  const props = importCalendarFieldPropsFromEnterprise(context, data)
  const result: To = {
    ...source,
    ...baseFields,
    ...props,
    elementType: source.elementType, // Сохраняем elementType из source
  }

  return result
}

const importCalendarFieldPropsFromEnterprise = (
  context: ConfigurationContext,
  data: CalendarFieldTypedEnterprise | CalendarFieldPartialEnterprise | undefined
): Omit<Partial<CalendarField>, "elementType" | "name"> => {
  const result: Omit<Partial<CalendarField>, "elementType" | "name"> = {}

  if (data === undefined) return result

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

  const events = importEventsFromEnterprise(context, data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportPartialFromEnterprise", "CalendarField", importCalendarFieldPropsFromEnterprise)
