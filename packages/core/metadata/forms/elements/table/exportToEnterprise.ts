import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportTypedChildItemsToEnterprise } from "~/metadata/forms/collections/childItems/exportToEnterprise"
import { exportCommandSetToEnterprise } from "~/metadata/forms/commandSet/exportToEnterprise"
import { exportBaseElementToEnterprise } from "~/metadata/forms/elements/baseElement/exportToEnterprise"
import { exportContextMenuToEnterprise } from "~/metadata/forms/elements/contextMenu/exportToEnterprise"
import { Table, TablePartialEnterprise } from "~/metadata/forms/elements/table/types"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { exportAutoCommandBarToEnterprise } from "../autoCommandBar/exportToEnterprise"
import { exportExtendedTooltipToEnterprise } from "../extendedTooltip/exportToEnterprise"
import { exportSearchControlAdditionToEnterprise } from "../searchControlAddition/exportToEnterprise"
import { exportSearchStringAdditionToEnterprise } from "../searchStringAddition/exportToEnterprise"
import { exportViewStatusAdditionToEnterprise } from "../viewStatusAddition/exportToEnterprise"
import { ExportPartialToEnterpriseFn } from "~/metadata/metadataFactory/types"

export const exportTableToEnterprise = (
  context: ConfigurationContext,
  data: Table | undefined
): TablePartialEnterprise | undefined => {
  if (!data) return undefined

  const baseFields = exportBaseElementToEnterprise(context, data)

  const result: TablePartialEnterprise = {
    ...baseFields,
  }

  const autoAddIncomplete = exportBooleanToEnterprise(context, data.autoAddIncomplete)
  if (autoAddIncomplete !== undefined) result.АвтоВводНезаполненного = autoAddIncomplete

  const autoInsertNewRow = exportBooleanToEnterprise(context, data.autoInsertNewRow)
  if (autoInsertNewRow !== undefined) result.АвтоВводНовойСтроки = autoInsertNewRow

  const autoCommandBar = exportAutoCommandBarToEnterprise(context, data.autoCommandBar)
  if (autoCommandBar !== undefined) result.КоманднаяПанель = autoCommandBar

  const autoMaxHeight = exportBooleanToEnterprise(context, data.autoMaxHeight)
  if (autoMaxHeight !== undefined) result.АвтоМаксимальнаяВысота = autoMaxHeight

  const autoMaxHeightInTableRows = exportBooleanToEnterprise(context, data.autoMaxHeightInTableRows)
  if (autoMaxHeightInTableRows !== undefined) result.АвтоМаксимальнаяВысотаВСтрокахТаблицы = autoMaxHeightInTableRows

  const autoMaxWidth = exportBooleanToEnterprise(context, data.autoMaxWidth)
  if (autoMaxWidth !== undefined) result.АвтоМаксимальнаяШирина = autoMaxWidth

  const autoMarkIncomplete = exportBooleanToEnterprise(context, data.autoMarkIncomplete)
  if (autoMarkIncomplete !== undefined) result.АвтоОтметкаНезаполненного = autoMarkIncomplete

  const defaultItem = exportBooleanToEnterprise(context, data.defaultItem)
  if (defaultItem !== undefined) result.АктивизироватьПоУмолчанию = defaultItem

  const displayImportance = exportSystemEnumerationToEnterprise(
    context,
    data.displayImportance,
    SE.DisplayImportanceToEnterprise
  )
  if (displayImportance !== undefined) result.ВажностьПриОтображении = displayImportance

  const heightControlVariant = exportSystemEnumerationToEnterprise(
    context,
    data.heightControlVariant,
    SE.TableHeightControlVariantToEnterprise
  )
  if (heightControlVariant !== undefined) result.ВариантУправленияВысотой = heightControlVariant

  const verticalScrollBar = exportSystemEnumerationToEnterprise(
    context,
    data.verticalScrollBar,
    SE.ScrollBarUseToEnterprise
  )
  if (verticalScrollBar !== undefined) result.ВертикальнаяПолосаПрокрутки = verticalScrollBar

  const verticalAlignInGroup = exportSystemEnumerationToEnterprise(
    context,
    data.verticalAlignInGroup,
    SE.ItemVerticalAlignToEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.ВертикальноеПоложениеВГруппе = verticalAlignInGroup

  const verticalLines = exportBooleanToEnterprise(context, data.verticalLines)
  if (verticalLines !== undefined) result.ВертикальныеЛинии = verticalLines

  const visible = exportBooleanToEnterprise(context, data.visible)
  if (visible !== undefined) result.Видимость = visible

  const output = exportSystemEnumerationToEnterprise(context, data.output, SE.UseOutputToEnterprise)
  if (output !== undefined) result.Вывод = output

  if (data.height !== undefined) result.Высота = data.height

  if (data.heightInTableRows !== undefined) result.ВысотаВСтрокахТаблицы = data.heightInTableRows

  if (data.titleHeight !== undefined) result.ВысотаЗаголовка = data.titleHeight

  if (data.footerHeight !== undefined) result.ВысотаПодвала = data.footerHeight

  if (data.headerHeight !== undefined) result.ВысотаШапки = data.headerHeight

  const horizontalScrollBar = exportSystemEnumerationToEnterprise(
    context,
    data.horizontalScrollBar,
    SE.ScrollBarUseToEnterprise
  )
  if (horizontalScrollBar !== undefined) result.ГоризонтальнаяПолосаПрокрутки = horizontalScrollBar

  const horizontalAlignInGroup = exportSystemEnumerationToEnterprise(
    context,
    data.horizontalAlignInGroup,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.ГоризонтальноеПоложениеВГруппе = horizontalAlignInGroup

  const horizontalLines = exportBooleanToEnterprise(context, data.horizontalLines)
  if (horizontalLines !== undefined) result.ГоризонтальныеЛинии = horizontalLines

  const enabled = exportBooleanToEnterprise(context, data.enabled)
  if (enabled !== undefined) result.Доступность = enabled

  const title = exportI8nTextToEnterprise(context, data.title)
  if (title !== undefined) result.Заголовок = title

  const refreshRequest = exportSystemEnumerationToEnterprise(
    context,
    data.refreshRequest,
    SE.RefreshRequestMethodToEnterprise
  )
  if (refreshRequest !== undefined) result.ЗапросОбновления = refreshRequest

  const changeRowOrder = exportBooleanToEnterprise(context, data.changeRowOrder)
  if (changeRowOrder !== undefined) result.ИзменятьПорядокСтрок = changeRowOrder

  const changeRowSet = exportBooleanToEnterprise(context, data.changeRowSet)
  if (changeRowSet !== undefined) result.ИзменятьСоставСтрок = changeRowSet

  const currentRowUse = exportSystemEnumerationToEnterprise(
    context,
    data.currentRowUse,
    SE.TableCurrentRowUseToEnterprise
  )
  if (currentRowUse !== undefined) result.ИспользованиеТекущейСтроки = currentRowUse

  const rowsPicture = exportBooleanToEnterprise(context, data.rowsPicture)
  if (rowsPicture !== undefined) result.КартинкаСтрок = rowsPicture

  const commandSet = exportCommandSetToEnterprise(context, data.commandSet)
  if (commandSet !== undefined) result.Команда = commandSet

  const contextMenu = exportContextMenuToEnterprise(context, data.contextMenu)
  if (contextMenu !== undefined) result.КонтекстноеМеню = contextMenu

  if (data.maxHeight !== undefined) result.МаксимальнаяВысота = data.maxHeight

  if (data.maxHeightInTableRows !== undefined) result.МаксимальнаяВысотаВСтрокахТаблицы = data.maxHeightInTableRows

  if (data.maxWidth !== undefined) result.МаксимальнаяШирина = data.maxWidth

  const multipleChoice = exportBooleanToEnterprise(context, data.multipleChoice)
  if (multipleChoice !== undefined) result.МножественныйВыбор = multipleChoice

  const initialTreeView = exportSystemEnumerationToEnterprise(
    context,
    data.initialTreeView,
    SE.InitialTreeViewToEnterprise
  )
  if (initialTreeView !== undefined) result.НачальноеОтображениеДерева = initialTreeView

  const initialListView = exportSystemEnumerationToEnterprise(
    context,
    data.initialListView,
    SE.InitialListViewToEnterprise
  )
  if (initialListView !== undefined) result.НачальноеОтображениеСписка = initialListView

  const markIncomplete = exportBooleanToEnterprise(context, data.markIncomplete)
  if (markIncomplete !== undefined) result.ОтметкаНезаполненного = markIncomplete

  const representation = exportSystemEnumerationToEnterprise(
    context,
    data.representation,
    SE.TableRepresentationToEnterprise
  )
  if (representation !== undefined) result.Отображение = representation

  const toolTipRepresentation = exportSystemEnumerationToEnterprise(
    context,
    data.toolTipRepresentation,
    SE.ToolTipRepresentationToEnterprise
  )
  if (toolTipRepresentation !== undefined) result.ОтображениеПодсказки = toolTipRepresentation

  const viewStatusRepresentation = exportViewStatusAdditionToEnterprise(context, data.viewStatusRepresentation)
  if (viewStatusRepresentation !== undefined) result.ОтображениеСостоянияПросмотра = viewStatusRepresentation

  const searchStringRepresentation = exportSearchStringAdditionToEnterprise(context, data.searchStringRepresentation)
  if (searchStringRepresentation !== undefined) result.ОтображениеСтрокиПоиска = searchStringRepresentation

  const behaviorOnHorizontalCompression = exportSystemEnumerationToEnterprise(
    context,
    data.behaviorOnHorizontalCompression,
    SE.TableBehaviorOnHorizontalCompressionToEnterprise
  )
  if (behaviorOnHorizontalCompression !== undefined)
    result.ПоведениеПриСжатииПоГоризонтали = behaviorOnHorizontalCompression

  const footer = exportBooleanToEnterprise(context, data.footer)
  if (footer !== undefined) result.Подвал = footer

  const toolTip = exportI8nTextToEnterprise(context, data.toolTip)
  if (toolTip !== undefined) result.Подсказка = toolTip

  const childItems = exportTypedChildItemsToEnterprise(context, data.childItems)
  if (childItems !== undefined) result.ПодчиненныеЭлементы = childItems

  const searchOnInput = exportSystemEnumerationToEnterprise(
    context,
    data.searchOnInput,
    SE.SearchInTableOnInputToEnterprise
  )
  if (searchOnInput !== undefined) result.ПоискПриВводе = searchOnInput

  const titleLocation = exportSystemEnumerationToEnterprise(
    context,
    data.titleLocation,
    SE.FormItemTitleLocationToEnterprise
  )
  if (titleLocation !== undefined) result.ПоложениеЗаголовка = titleLocation

  const commandBarLocation = exportSystemEnumerationToEnterprise(
    context,
    data.commandBarLocation,
    SE.FormItemCommandBarLabelLocationToEnterprise
  )
  if (commandBarLocation !== undefined) result.ПоложениеКоманднойПанели = commandBarLocation

  const viewStatusLocation = exportSystemEnumerationToEnterprise(
    context,
    data.viewStatusLocation,
    SE.ViewStatusLocationToEnterprise
  )
  if (viewStatusLocation !== undefined) result.ПоложениеСостоянияПросмотра = viewStatusLocation

  const searchStringLocation = exportSystemEnumerationToEnterprise(
    context,
    data.searchStringLocation,
    SE.SearchStringLocationToEnterprise
  )
  if (searchStringLocation !== undefined) result.ПоложениеСтрокиПоиска = searchStringLocation

  const searchControlLocation = exportSystemEnumerationToEnterprise(
    context,
    data.searchControlLocation,
    SE.SearchControlLocationToEnterprise
  )
  if (searchControlLocation !== undefined) result.ПоложениеУправленияПоиском = searchControlLocation

  const userVisible = exportUserVisibleToEnterprise(context, data.userVisible)
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const skipOnInput = exportBooleanToEnterprise(context, data.skipOnInput)
  if (skipOnInput !== undefined) result.ПропускатьПриВводе = skipOnInput

  if (data.dataPath !== undefined) result.ПутьКДанным = data.dataPath

  if (data.rowPictureDataPath !== undefined) result.ПутьКДаннымКартинкиСтроки = data.rowPictureDataPath

  const enableStartDrag = exportBooleanToEnterprise(context, data.enableStartDrag)
  if (enableStartDrag !== undefined) result.РазрешитьНачалоПеретаскивания = enableStartDrag

  const enableDrag = exportBooleanToEnterprise(context, data.enableDrag)
  if (enableDrag !== undefined) result.РазрешитьПеретаскивание = enableDrag

  const verticalStretch = exportBooleanToEnterprise(context, data.verticalStretch)
  if (verticalStretch !== undefined) result.РастягиватьПоВертикали = verticalStretch

  const horizontalStretch = exportBooleanToEnterprise(context, data.horizontalStretch)
  if (horizontalStretch !== undefined) result.РастягиватьПоГоризонтали = horizontalStretch

  const extendedTooltip = exportExtendedTooltipToEnterprise(context, data.extendedTooltip)
  if (extendedTooltip !== undefined) result.РасширеннаяПодсказка = extendedTooltip

  const rowInputMode = exportSystemEnumerationToEnterprise(context, data.rowInputMode, SE.TableRowInputModeToEnterprise)
  if (rowInputMode !== undefined) result.РежимВводаСтрок = rowInputMode

  const choiceMode = exportBooleanToEnterprise(context, data.choiceMode)
  if (choiceMode !== undefined) result.РежимВыбора = choiceMode

  const selectionMode = exportSystemEnumerationToEnterprise(
    context,
    data.selectionMode,
    SE.TableSelectionModeToEnterprise
  )
  if (selectionMode !== undefined) result.РежимВыделения = selectionMode

  const rowSelectionMode = exportSystemEnumerationToEnterprise(
    context,
    data.rowSelectionMode,
    SE.TableRowSelectionModeToEnterprise
  )
  if (rowSelectionMode !== undefined) result.РежимВыделенияСтроки = rowSelectionMode

  if (data.shortcut !== undefined) result.СочетаниеКлавиш = data.shortcut

  const fileDragMode = exportSystemEnumerationToEnterprise(context, data.fileDragMode, SE.FileDragModeToEnterprise)
  if (fileDragMode !== undefined) result.СпособПеретаскиванияФайлов = fileDragMode

  const readOnly = exportBooleanToEnterprise(context, data.readOnly)
  if (readOnly !== undefined) result.ТолькоПросмотр = readOnly

  const searchControl = exportSearchControlAdditionToEnterprise(context, data.searchControl)
  if (searchControl !== undefined) result.УправлениеПоиском = searchControl

  const borderColor = exportColorToEnterprise(context, data.borderColor)
  if (borderColor !== undefined) result.ЦветРамки = borderColor

  const textColor = exportColorToEnterprise(context, data.textColor)
  if (textColor !== undefined) result.ЦветТекста = textColor

  const titleTextColor = exportColorToEnterprise(context, data.titleTextColor)
  if (titleTextColor !== undefined) result.ЦветТекстаЗаголовка = titleTextColor

  const backColor = exportColorToEnterprise(context, data.backColor)
  if (backColor !== undefined) result.ЦветФона = backColor

  const useAlternationRowColor = exportBooleanToEnterprise(context, data.useAlternationRowColor)
  if (useAlternationRowColor !== undefined) result.ЧередованиеЦветовСтрок = useAlternationRowColor

  const header = exportBooleanToEnterprise(context, data.header)
  if (header !== undefined) result.Шапка = header

  if (data.width !== undefined) result.Ширина = data.width

  const font = exportFontToEnterprise(context, data.font)
  if (font !== undefined) result.Шрифт = font

  const titleFont = exportFontToEnterprise(context, data.titleFont)
  if (titleFont !== undefined) result.ШрифтЗаголовка = titleFont

  const events = exportEventsToEnterprise(context, data.events)
  if (events !== undefined) result.События = events

  return result
}

registerMetadata("ExportPartialToEnterprise", "Table", exportTableToEnterprise as ExportPartialToEnterpriseFn)
