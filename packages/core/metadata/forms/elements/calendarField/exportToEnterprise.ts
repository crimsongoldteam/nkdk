import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import {
  exportI8nTextOtherToEnterprise,
  exportI8nTextToEnterprise,
} from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { UserVisibleKeysEnterprise } from "~/metadata/commonObjects/userVisible/types"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  CalendarField,
  CalendarFieldPartialEnterprise,
  CalendarFieldTypedEnterprise,
} from "~/metadata/forms/elements/calendarField/types"
import { exportContextMenuToEnterprise } from "~/metadata/forms/elements/contextMenu/exportToEnterprise"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  ExportPartialToEnterpriseFn,
  ExportTypedToEnterpriseFn,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { exportBaseElementToEnterprise } from "../baseElement/exportToEnterprise"
import { exportExtendedTooltipToEnterprise } from "../extendedTooltip/exportToEnterprise"

export function exportCalendarFieldTypedToEnterprise<From extends CalendarField | undefined>(
  context: ConfigurationContext,
  data: From
): ToTypedEnterpriseType<From> {
  if (data === undefined) return undefined as ToTypedEnterpriseType<From>

  const baseFields = exportBaseElementToEnterprise(context, data)

  const props = exportCalendarFieldPropsToEnterprise(context, data)

  const result: CalendarFieldTypedEnterprise = {
    Тип: "ПолеКалендаря",
    ...baseFields,
    ...props,
  }

  const title = exportI8nTextToEnterprise(context, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result) as ToTypedEnterpriseType<From>
}

export function exportCalendarFieldPartialToEnterprise<From extends CalendarField | undefined>(
  context: ConfigurationContext,
  data: From
): ToPartialEnterpriseType<From> {
  if (data === undefined) return undefined as ToPartialEnterpriseType<From>

  const baseFields = exportBaseElementToEnterprise(context, data)

  const props = exportCalendarFieldPropsToEnterprise(context, data)

  const result: CalendarFieldPartialEnterprise = {
    ...baseFields,
    ...props,
  }

  const title = exportI8nTextOtherToEnterprise(context, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result) as ToPartialEnterpriseType<From>
}

const exportCalendarFieldPropsToEnterprise = (
  context: ConfigurationContext,
  data: CalendarField
): CalendarFieldPartialEnterprise => {
  const result: CalendarFieldPartialEnterprise = {}

  const autoCellHeight = exportBooleanToEnterprise(context, data.autoCellHeight)
  if (autoCellHeight !== undefined) result.АвтоВысотаЯчейки = autoCellHeight

  const defaultItem = exportBooleanToEnterprise(context, data.defaultItem)
  if (defaultItem !== undefined) result.АктивизироватьПоУмолчанию = defaultItem

  const displayImportance = exportSystemEnumerationToEnterprise(
    context,
    data.displayImportance,
    SE.DisplayImportanceToEnterprise
  )
  if (displayImportance !== undefined) result.ВажностьПриОтображении = displayImportance

  const verticalAlign = exportSystemEnumerationToEnterprise(
    context,
    data.verticalAlignInGroup,
    SE.ItemVerticalAlignToEnterprise
  )
  if (verticalAlign !== undefined) result.ВертикальноеПоложение = verticalAlign

  const visible = exportBooleanToEnterprise(context, data.visible)
  if (visible !== undefined) result.Видимость = visible

  if (data.titleHeight !== undefined) result.ВысотаЗаголовка = data.titleHeight

  const cellHyperlink = exportBooleanToEnterprise(context, data.cellHyperlink)
  if (cellHyperlink !== undefined) result.ГиперссылкаЯчейки = cellHyperlink

  const horizontalAlign = exportSystemEnumerationToEnterprise(
    context,
    data.horizontalAlignInGroup,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (horizontalAlign !== undefined) result.ГоризонтальноеПоложение = horizontalAlign

  const enabled = exportBooleanToEnterprise(context, data.enabled)
  if (enabled !== undefined) result.Доступность = enabled

  const contextMenu = exportContextMenuToEnterprise(context, data.contextMenu)
  if (contextMenu !== undefined) result.КонтекстноеМеню = contextMenu

  const toolTipRepresentation = exportSystemEnumerationToEnterprise(
    context,
    data.toolTipRepresentation,
    SE.ToolTipRepresentationToEnterprise
  )
  if (toolTipRepresentation !== undefined) result.ОтображениеПодсказки = toolTipRepresentation

  const warningOnEditRepresentation = exportSystemEnumerationToEnterprise(
    context,
    data.warningOnEditRepresentation,
    SE.WarningOnEditRepresentationToEnterprise
  )
  if (warningOnEditRepresentation !== undefined)
    result.ОтображениеПредупрежденияПриРедактировании = warningOnEditRepresentation

  const toolTip = exportI8nTextToEnterprise(context, data.toolTip)
  if (toolTip !== undefined) result.Подсказка = toolTip

  const titleLocation = exportSystemEnumerationToEnterprise(
    context,
    data.titleLocation,
    SE.FormItemTitleLocationToEnterprise
  )
  if (titleLocation !== undefined) result.ПоложениеЗаголовка = titleLocation

  const warningOnEdit = exportI8nTextToEnterprise(context, data.warningOnEdit)
  if (warningOnEdit !== undefined) result.ПредупреждениеПриРедактировании = warningOnEdit

  const skipOnInput = exportBooleanToEnterprise(context, data.skipOnInput)
  if (skipOnInput !== undefined) result.ПропускатьПриВводе = skipOnInput

  if (data.dataPath !== undefined) result.ПутьКДанным = data.dataPath

  const extendedTooltip = exportExtendedTooltipToEnterprise(context, data.extendedTooltip)
  if (extendedTooltip !== undefined) result.РасширеннаяПодсказка = extendedTooltip

  if (data.shortcut !== undefined) result.СочетаниеКлавиш = data.shortcut

  const readOnly = exportBooleanToEnterprise(context, data.readOnly)
  if (readOnly !== undefined) result.ТолькоПросмотр = readOnly

  const titleTextColor = exportColorToEnterprise(context, data.titleTextColor)
  if (titleTextColor !== undefined) result.ЦветТекстаЗаголовка = titleTextColor

  const titleFont = exportFontToEnterprise(context, data.titleFont)
  if (titleFont !== undefined) result.ШрифтЗаголовка = titleFont

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

  const userVisible = exportUserVisibleToEnterprise(context, data.userVisible, {
    allow: UserVisibleKeysEnterprise.Allow,
    deny: UserVisibleKeysEnterprise.Deny,
  })
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

  const onMainServerUnavalableBehavior = exportSystemEnumerationToEnterprise(
    context,
    data.onMainServerUnavalableBehavior,
    SE.OnMainServerUnavalableBehaviorToEnterprise
  )
  if (onMainServerUnavalableBehavior !== undefined)
    result.ПоведениеПриНедоступностиОсновногоСервера = onMainServerUnavalableBehavior

  const events = exportEventsToEnterprise(context, data.events)
  if (events !== undefined) result.События = events

  return result
}

registerMetadata(
  "ExportPartialToEnterprise",
  "CalendarField",
  exportCalendarFieldPartialToEnterprise as ExportPartialToEnterpriseFn
)
registerMetadata(
  "ExportTypedToEnterprise",
  "CalendarField",
  exportCalendarFieldTypedToEnterprise as ExportTypedToEnterpriseFn
)
