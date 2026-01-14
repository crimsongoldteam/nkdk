import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  CalendarField,
  CalendarFieldPartialEnterprise,
  CalendarFieldTypedEnterprise,
} from "~/metadata/forms/elements/calendarField/types"
import { exportFormFieldToEnterprise } from "~/metadata/forms/elements/formField/exportToEnterprise"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ToPartialEnterpriseType, ToTypedEnterpriseType } from "~/metadata/metadataFactory/types"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export function exportCalendarFieldTypedToEnterprise<From extends CalendarField | undefined>(
  context: ConfigurationContext,
  data: From
): ToTypedEnterpriseType<From> {
  if (data === undefined) return undefined as ToTypedEnterpriseType<From>

  const baseFields = exportFormFieldToEnterprise(context, data)

  const props = exportCalendarFieldPropsToEnterprise(context, data)

  const result: CalendarFieldTypedEnterprise = {
    Тип: "ПолеКалендаря",
    ...baseFields,
    ...props,
  }

  return sortObject(result) as ToTypedEnterpriseType<From>
}

export function exportCalendarFieldPartialToEnterprise<From extends CalendarField | undefined>(
  context: ConfigurationContext,
  data: From
): ToPartialEnterpriseType<From> {
  if (data === undefined) return undefined as ToPartialEnterpriseType<From>

  const baseFields = exportFormFieldToEnterprise(context, data)

  const props = exportCalendarFieldPropsToEnterprise(context, data)

  const result: CalendarFieldPartialEnterprise = {
    ...baseFields,
    ...props,
  }

  return sortObject(result) as ToPartialEnterpriseType<From>
}

const exportCalendarFieldPropsToEnterprise = (
  context: ConfigurationContext,
  data: CalendarField
): CalendarFieldPartialEnterprise => {
  const result: CalendarFieldPartialEnterprise = {}

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

  const userVisible = exportUserVisibleToEnterprise(context, data.userVisible)
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

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

  const events = exportEventsToEnterprise(context, data.events)
  if (events !== undefined) result.События = events

  return result
}

registerMetadata("ExportPartialToEnterprise", "CalendarField", exportCalendarFieldPartialToEnterprise)
registerMetadata("ExportTypedToEnterprise", "CalendarField", exportCalendarFieldTypedToEnterprise)
