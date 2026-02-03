import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportPictureToEnterprise } from "~/metadata/commonObjects/picture/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { UserVisibleKeysEnterprise } from "~/metadata/commonObjects/userVisible/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportCommandSetToEnterprise } from "~/metadata/forms/commandSet/exportToEnterprise"
import { exportBaseElementToEnterprise } from "~/metadata/forms/elements/baseElement/exportToEnterprise"
import { exportContextMenuToEnterprise } from "~/metadata/forms/elements/contextMenu/exportToEnterprise"
import { Table, TablePartialEnterprise } from "~/metadata/forms/elements/table/types"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportPartialToEnterpriseFn } from "~/metadata/metadataFactory/types"
import { exportSystemEnumerationToYAML } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { exportAutoCommandBarToEnterprise } from "../autoCommandBar/exportToEnterprise"
import { PropertyRule } from "../calendarField/rules"
import { exportExtendedTooltipToEnterprise } from "../extendedTooltip/exportToEnterprise"
import { exportSingleSearchControlAdditionToEnterprise } from "../searchControlAddition/exportToEnterprise"
import { exportSingleSearchStringAdditionToEnterprise } from "../searchStringAddition/exportToEnterprise"
import { exportViewStatusAdditionToEnterprise } from "../viewStatusAddition/exportToEnterprise"

export const exportTableToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: Table | undefined
): TablePartialEnterprise | undefined => {
  if (!data) return undefined

  const baseFields = exportBaseElementToEnterprise(context, undefined, data)

  const result: TablePartialEnterprise = {
    ...baseFields,
  }

  const autoAddIncomplete = exportBooleanToEnterprise(context, undefined, data.autoAddIncomplete)
  if (autoAddIncomplete !== undefined) result.АвтоВводНезаполненного = autoAddIncomplete

  const autoInsertNewRow = exportBooleanToEnterprise(context, undefined, data.autoInsertNewRow)
  if (autoInsertNewRow !== undefined) result.АвтоВводНовойСтроки = autoInsertNewRow

  const autoCommandBar = exportAutoCommandBarToEnterprise(context, undefined, data.autoCommandBar)
  if (autoCommandBar !== undefined) result.КоманднаяПанель = autoCommandBar

  const autoMaxHeight = exportBooleanToEnterprise(context, undefined, data.autoMaxHeight)
  if (autoMaxHeight !== undefined) result.АвтоМаксимальнаяВысота = autoMaxHeight

  const autoMaxHeightInTableRows = exportBooleanToEnterprise(context, undefined, data.autoMaxHeightInTableRows)
  if (autoMaxHeightInTableRows !== undefined) result.АвтоМаксимальнаяВысотаВСтрокахТаблицы = autoMaxHeightInTableRows

  const autoMaxWidth = exportBooleanToEnterprise(context, undefined, data.autoMaxWidth)
  if (autoMaxWidth !== undefined) result.АвтоМаксимальнаяШирина = autoMaxWidth

  const autoMarkIncomplete = exportBooleanToEnterprise(context, undefined, data.autoMarkIncomplete)
  if (autoMarkIncomplete !== undefined) result.АвтоОтметкаНезаполненного = autoMarkIncomplete

  const defaultItem = exportBooleanToEnterprise(context, undefined, data.defaultItem)
  if (defaultItem !== undefined) result.АктивизироватьПоУмолчанию = defaultItem

  const displayImportance = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.displayImportance,
    SE.DisplayImportanceToEnterprise
  )
  if (displayImportance !== undefined) result.ВажностьПриОтображении = displayImportance

  const heightControlVariant = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.heightControlVariant,
    SE.TableHeightControlVariantToEnterprise
  )
  if (heightControlVariant !== undefined) result.ВариантУправленияВысотой = heightControlVariant

  const verticalScrollBar = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.verticalScrollBar,
    SE.ScrollBarUseToEnterprise
  )
  if (verticalScrollBar !== undefined) result.ВертикальнаяПолосаПрокрутки = verticalScrollBar

  const verticalAlignInGroup = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.verticalAlignInGroup,
    SE.ItemVerticalAlignToEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.ВертикальноеПоложениеВГруппе = verticalAlignInGroup

  const verticalLines = exportBooleanToEnterprise(context, undefined, data.verticalLines)
  if (verticalLines !== undefined) result.ВертикальныеЛинии = verticalLines

  const visible = exportBooleanToEnterprise(context, undefined, data.visible)
  if (visible !== undefined) result.Видимость = visible

  const output = exportSystemEnumerationToYAML(context, undefined, data.output, SE.UseOutputToEnterprise)
  if (output !== undefined) result.Вывод = output

  if (data.height !== undefined) result.Высота = data.height

  if (data.heightInTableRows !== undefined) result.ВысотаВСтрокахТаблицы = data.heightInTableRows

  if (data.titleHeight !== undefined) result.ВысотаЗаголовка = data.titleHeight

  if (data.footerHeight !== undefined) result.ВысотаПодвала = data.footerHeight

  if (data.headerHeight !== undefined) result.ВысотаШапки = data.headerHeight

  const horizontalScrollBar = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.horizontalScrollBar,
    SE.ScrollBarUseToEnterprise
  )
  if (horizontalScrollBar !== undefined) result.ГоризонтальнаяПолосаПрокрутки = horizontalScrollBar

  const horizontalAlignInGroup = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.horizontalAlignInGroup,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.ГоризонтальноеПоложениеВГруппе = horizontalAlignInGroup

  const horizontalLines = exportBooleanToEnterprise(context, undefined, data.horizontalLines)
  if (horizontalLines !== undefined) result.ГоризонтальныеЛинии = horizontalLines

  const enabled = exportBooleanToEnterprise(context, undefined, data.enabled)
  if (enabled !== undefined) result.Доступность = enabled

  const title = exportI8nTextToEnterprise(context, undefined, data.title)
  if (title !== undefined) result.Заголовок = title

  const refreshRequest = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.refreshRequest,
    SE.RefreshRequestMethodToEnterprise
  )
  if (refreshRequest !== undefined) result.ЗапросОбновления = refreshRequest

  const changeRowOrder = exportBooleanToEnterprise(context, undefined, data.changeRowOrder)
  if (changeRowOrder !== undefined) result.ИзменятьПорядокСтрок = changeRowOrder

  const changeRowSet = exportBooleanToEnterprise(context, undefined, data.changeRowSet)
  if (changeRowSet !== undefined) result.ИзменятьСоставСтрок = changeRowSet

  const currentRowUse = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.currentRowUse,
    SE.TableCurrentRowUseToEnterprise
  )
  if (currentRowUse !== undefined) result.ИспользованиеТекущейСтроки = currentRowUse

  const rowsPicture = exportPictureToEnterprise(context, undefined, data.rowsPicture)
  if (rowsPicture !== undefined) result.КартинкаСтрок = rowsPicture

  const commandSet = exportCommandSetToEnterprise(context, undefined, data.commandSet)
  if (commandSet !== undefined) result.Команда = commandSet

  const contextMenu = exportContextMenuToEnterprise(context, undefined, data.contextMenu)
  if (contextMenu !== undefined) result.КонтекстноеМеню = contextMenu

  if (data.maxHeight !== undefined) result.МаксимальнаяВысота = data.maxHeight

  if (data.maxHeightInTableRows !== undefined) result.МаксимальнаяВысотаВСтрокахТаблицы = data.maxHeightInTableRows

  if (data.maxWidth !== undefined) result.МаксимальнаяШирина = data.maxWidth

  const multipleChoice = exportBooleanToEnterprise(context, undefined, data.multipleChoice)
  if (multipleChoice !== undefined) result.МножественныйВыбор = multipleChoice

  const initialTreeView = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.initialTreeView,
    SE.InitialTreeViewToEnterprise
  )
  if (initialTreeView !== undefined) result.НачальноеОтображениеДерева = initialTreeView

  const initialListView = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.initialListView,
    SE.InitialListViewToEnterprise
  )
  if (initialListView !== undefined) result.НачальноеОтображениеСписка = initialListView

  const markIncomplete = exportBooleanToEnterprise(context, undefined, data.markIncomplete)
  if (markIncomplete !== undefined) result.ОтметкаНезаполненного = markIncomplete

  const representation = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.representation,
    SE.TableRepresentationToEnterprise
  )
  if (representation !== undefined) result.Отображение = representation

  const toolTipRepresentation = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.toolTipRepresentation,
    SE.ToolTipRepresentationToEnterprise
  )
  if (toolTipRepresentation !== undefined) result.ОтображениеПодсказки = toolTipRepresentation

  const viewStatusAddition = exportViewStatusAdditionToEnterprise(context, undefined, data.viewStatusAddition)
  if (viewStatusAddition !== undefined) result.ОтображениеСостоянияПросмотра = viewStatusAddition

  const searchStringAddition = exportSingleSearchStringAdditionToEnterprise(
    context,
    undefined,
    data.searchStringAddition
  )
  if (searchStringAddition !== undefined) result.ОтображениеСтрокиПоиска = searchStringAddition

  const behaviorOnHorizontalCompression = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.behaviorOnHorizontalCompression,
    SE.TableBehaviorOnHorizontalCompressionToEnterprise
  )
  if (behaviorOnHorizontalCompression !== undefined)
    result.ПоведениеПриСжатииПоГоризонтали = behaviorOnHorizontalCompression

  const footer = exportBooleanToEnterprise(context, undefined, data.footer)
  if (footer !== undefined) result.Подвал = footer

  const toolTip = exportI8nTextToEnterprise(context, undefined, data.toolTip)
  if (toolTip !== undefined) result.Подсказка = toolTip

  // const childItems = exportTypedChildItemsToEnterprise(context, undefined, data.childItems)
  // if (childItems !== undefined) result.ПодчиненныеЭлементы = childItems

  const searchOnInput = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.searchOnInput,
    SE.SearchInTableOnInputToEnterprise
  )
  if (searchOnInput !== undefined) result.ПоискПриВводе = searchOnInput

  const titleLocation = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.titleLocation,
    SE.FormItemTitleLocationToEnterprise
  )
  if (titleLocation !== undefined) result.ПоложениеЗаголовка = titleLocation

  const commandBarLocation = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.commandBarLocation,
    SE.FormItemCommandBarLabelLocationToEnterprise
  )
  if (commandBarLocation !== undefined) result.ПоложениеКоманднойПанели = commandBarLocation

  const viewStatusLocation = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.viewStatusLocation,
    SE.ViewStatusLocationToEnterprise
  )
  if (viewStatusLocation !== undefined) result.ПоложениеСостоянияПросмотра = viewStatusLocation

  const searchStringLocation = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.searchStringLocation,
    SE.SearchStringLocationToEnterprise
  )
  if (searchStringLocation !== undefined) result.ПоложениеСтрокиПоиска = searchStringLocation

  const searchControlLocation = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.searchControlLocation,
    SE.SearchControlLocationToEnterprise
  )
  if (searchControlLocation !== undefined) result.ПоложениеУправленияПоиском = searchControlLocation

  const userVisible = exportUserVisibleToEnterprise(context, undefined, data.userVisible, {
    allow: UserVisibleKeysEnterprise.Allow,
    deny: UserVisibleKeysEnterprise.Deny,
  })
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const skipOnInput = exportBooleanToEnterprise(context, undefined, data.skipOnInput)
  if (skipOnInput !== undefined) result.ПропускатьПриВводе = skipOnInput

  if (data.dataPath !== undefined) result.ПутьКДанным = data.dataPath

  if (data.rowPictureDataPath !== undefined) result.ПутьКДаннымКартинкиСтроки = data.rowPictureDataPath

  const enableStartDrag = exportBooleanToEnterprise(context, undefined, data.enableStartDrag)
  if (enableStartDrag !== undefined) result.РазрешитьНачалоПеретаскивания = enableStartDrag

  const enableDrag = exportBooleanToEnterprise(context, undefined, data.enableDrag)
  if (enableDrag !== undefined) result.РазрешитьПеретаскивание = enableDrag

  const verticalStretch = exportBooleanToEnterprise(context, undefined, data.verticalStretch)
  if (verticalStretch !== undefined) result.РастягиватьПоВертикали = verticalStretch

  const horizontalStretch = exportBooleanToEnterprise(context, undefined, data.horizontalStretch)
  if (horizontalStretch !== undefined) result.РастягиватьПоГоризонтали = horizontalStretch

  const extendedTooltip = exportExtendedTooltipToEnterprise(context, undefined, data.extendedTooltip)
  if (extendedTooltip !== undefined) result.РасширеннаяПодсказка = extendedTooltip

  const rowInputMode = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.rowInputMode,
    SE.TableRowInputModeToEnterprise
  )
  if (rowInputMode !== undefined) result.РежимВводаСтрок = rowInputMode

  const choiceMode = exportBooleanToEnterprise(context, undefined, data.choiceMode)
  if (choiceMode !== undefined) result.РежимВыбора = choiceMode

  const selectionMode = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.selectionMode,
    SE.TableSelectionModeToEnterprise
  )
  if (selectionMode !== undefined) result.РежимВыделения = selectionMode

  const rowSelectionMode = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.rowSelectionMode,
    SE.TableRowSelectionModeToEnterprise
  )
  if (rowSelectionMode !== undefined) result.РежимВыделенияСтроки = rowSelectionMode

  if (data.shortcut !== undefined) result.СочетаниеКлавиш = data.shortcut

  const fileDragMode = exportSystemEnumerationToYAML(context, undefined, data.fileDragMode, SE.FileDragModeToEnterprise)
  if (fileDragMode !== undefined) result.СпособПеретаскиванияФайлов = fileDragMode

  const readOnly = exportBooleanToEnterprise(context, undefined, data.readOnly)
  if (readOnly !== undefined) result.ТолькоПросмотр = readOnly

  const searchControl = exportSingleSearchControlAdditionToEnterprise(context, undefined, data.searchControl)
  if (searchControl !== undefined) result.УправлениеПоиском = searchControl

  const borderColor = exportColorToEnterprise(context, undefined, data.borderColor)
  if (borderColor !== undefined) result.ЦветРамки = borderColor

  const textColor = exportColorToEnterprise(context, undefined, data.textColor)
  if (textColor !== undefined) result.ЦветТекста = textColor

  const titleTextColor = exportColorToEnterprise(context, undefined, data.titleTextColor)
  if (titleTextColor !== undefined) result.ЦветТекстаЗаголовка = titleTextColor

  const backColor = exportColorToEnterprise(context, undefined, data.backColor)
  if (backColor !== undefined) result.ЦветФона = backColor

  const useAlternationRowColor = exportBooleanToEnterprise(context, undefined, data.useAlternationRowColor)
  if (useAlternationRowColor !== undefined) result.ЧередованиеЦветовСтрок = useAlternationRowColor

  const header = exportBooleanToEnterprise(context, undefined, data.header)
  if (header !== undefined) result.Шапка = header

  if (data.width !== undefined) result.Ширина = data.width

  const font = exportFontToEnterprise(context, undefined, data.font)
  if (font !== undefined) result.Шрифт = font

  const titleFont = exportFontToEnterprise(context, undefined, data.titleFont)
  if (titleFont !== undefined) result.ШрифтЗаголовка = titleFont

  const events = exportEventsToEnterprise(context, undefined, data.events)
  if (events !== undefined) result.События = events

  const autoRefresh = exportBooleanToEnterprise(context, undefined, data.autoRefresh)
  if (autoRefresh !== undefined) result.АвтоОбновление = autoRefresh

  const restoreCurrentRow = exportBooleanToEnterprise(context, undefined, data.restoreCurrentRow)
  if (restoreCurrentRow !== undefined) result.ВосстанавливатьТекущуюСтроку = restoreCurrentRow

  const choiceFoldersAndItems = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.choiceFoldersAndItems,
    SE.FoldersAndItemsUseToEnterprise
  )
  if (choiceFoldersAndItems !== undefined) result.ВыборГруппИЭлементов = choiceFoldersAndItems

  const additionalCreateParameters = exportBooleanToEnterprise(context, undefined, data.additionalCreateParameters)
  if (additionalCreateParameters !== undefined) result.ДополнительныеПараметрыСоздания = additionalCreateParameters

  const updateOnDataChange = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.updateOnDataChange,
    SE.UpdateOnDataChangeToEnterprise
  )
  if (updateOnDataChange !== undefined) result.ОбновлениеПриИзмененииДанных = updateOnDataChange

  const showRoot = exportBooleanToEnterprise(context, undefined, data.showRoot)
  if (showRoot !== undefined) result.ОтображатьКорень = showRoot

  if (data.autoRefreshPeriod !== undefined) result.ПериодАвтоОбновления = data.autoRefreshPeriod

  const allowRootChoice = exportBooleanToEnterprise(context, undefined, data.allowRootChoice)
  if (allowRootChoice !== undefined) result.РазрешитьВыборКорня = allowRootChoice

  const allowGettingCurrentRowURL = exportBooleanToEnterprise(context, undefined, data.allowGettingCurrentRowURL)
  if (allowGettingCurrentRowURL !== undefined)
    result.РазрешитьПолучатьНавигационнуюСсылкуТекущейСтроки = allowGettingCurrentRowURL

  if (data.userSettingsGroup !== undefined) result.ГруппаПользовательскихНастроек = data.userSettingsGroup

  return result
}

registerMetadata("ExportPartialToEnterprise", "Table", exportTableToEnterprise as ExportPartialToEnterpriseFn)
