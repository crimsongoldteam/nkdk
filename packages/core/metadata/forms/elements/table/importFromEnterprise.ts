import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importFontFromEnterprise } from "~/metadata/commonObjects/font/importFromEnterprise"
import { importI8nTextFromEnterprise } from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { importCommandSetFromEnterprise } from "~/metadata/forms/commandSet/importFromEnterprise"
import { importBaseElementFromEnterprise } from "~/metadata/forms/elements/baseElement/importFromEnterprise"
import { importContextMenuFromEnterprise } from "~/metadata/forms/elements/contextMenu/importFromEnterprise"
import { Table, TableEnterprise } from "~/metadata/forms/elements/table/types"
import { ImportFromEnterpriseReturn } from "~/metadata/forms/elements/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importAutoCommandBarFromEnterprise } from "../autoCommandBar/importFromEnterprise"
import { importExtendedTooltipFromEnterprise } from "../extendedTooltip/importFromEnterprise"
import { importSearchControlAdditionFromEnterprise } from "../searchControlAddition/importFromEnterprise"
import { importSearchStringAdditionFromEnterprise } from "../searchStringAddition/importFromEnterprise"
import { importViewStatusAdditionFromEnterprise } from "../viewStatusAddition/importFromEnterprise"

const importTableEventsFromEnterprise = (
  data:
    | {
        Выбор?: string
        ВыборЗначения?: string
        НачалоПеретаскивания?: string
        ОбработкаВыбора?: string
        ОбработкаЗаписиНового?: string
        ОбработкаЗапросаОбновления?: string
        ОкончаниеПеретаскивания?: string
        ПередНачаломДобавления?: string
        ПередНачаломИзменения?: string
        ПередОкончаниемРедактирования?: string
        ПередРазворачиванием?: string
        ПередСворачиванием?: string
        ПередУдалением?: string
        Перетаскивание?: string
        ПослеУдаления?: string
        ПриАктивизацииПоля?: string
        ПриАктивизацииСтроки?: string
        ПриАктивизацииЯчейки?: string
        ПриИзменении?: string
        ПриНачалеРедактирования?: string
        ПриОкончанииРедактирования?: string
        ПриСменеТекущегоРодителя?: string
        ПроверкаПеретаскивания?: string
      }
    | undefined
):
  | {
      selection?: string
      valueChoice?: string
      dragStart?: string
      choiceProcessing?: string
      newWriteProcessing?: string
      refreshRequestProcessing?: string
      dragEnd?: string
      beforeAddRow?: string
      beforeRowChange?: string
      beforeEditEnd?: string
      beforeExpand?: string
      beforeCollapse?: string
      beforeDeleteRow?: string
      drag?: string
      afterDeleteRow?: string
      onActivateField?: string
      onActivateRow?: string
      onActivateCell?: string
      onChange?: string
      onStartEdit?: string
      onEditEnd?: string
      onCurrentParentChange?: string
      dragCheck?: string
    }
  | undefined => {
  if (!data) return undefined

  const result: {
    selection?: string
    valueChoice?: string
    dragStart?: string
    choiceProcessing?: string
    newWriteProcessing?: string
    refreshRequestProcessing?: string
    dragEnd?: string
    beforeAddRow?: string
    beforeRowChange?: string
    beforeEditEnd?: string
    beforeExpand?: string
    beforeCollapse?: string
    beforeDeleteRow?: string
    drag?: string
    afterDeleteRow?: string
    onActivateField?: string
    onActivateRow?: string
    onActivateCell?: string
    onChange?: string
    onStartEdit?: string
    onEditEnd?: string
    onCurrentParentChange?: string
    dragCheck?: string
  } = {}

  if (data.Выбор !== undefined) result.selection = data.Выбор
  if (data.ВыборЗначения !== undefined) result.valueChoice = data.ВыборЗначения
  if (data.НачалоПеретаскивания !== undefined) result.dragStart = data.НачалоПеретаскивания
  if (data.ОбработкаВыбора !== undefined) result.choiceProcessing = data.ОбработкаВыбора
  if (data.ОбработкаЗаписиНового !== undefined) result.newWriteProcessing = data.ОбработкаЗаписиНового
  if (data.ОбработкаЗапросаОбновления !== undefined) result.refreshRequestProcessing = data.ОбработкаЗапросаОбновления
  if (data.ОкончаниеПеретаскивания !== undefined) result.dragEnd = data.ОкончаниеПеретаскивания
  if (data.ПередНачаломДобавления !== undefined) result.beforeAddRow = data.ПередНачаломДобавления
  if (data.ПередНачаломИзменения !== undefined) result.beforeRowChange = data.ПередНачаломИзменения
  if (data.ПередОкончаниемРедактирования !== undefined) result.beforeEditEnd = data.ПередОкончаниемРедактирования
  if (data.ПередРазворачиванием !== undefined) result.beforeExpand = data.ПередРазворачиванием
  if (data.ПередСворачиванием !== undefined) result.beforeCollapse = data.ПередСворачиванием
  if (data.ПередУдалением !== undefined) result.beforeDeleteRow = data.ПередУдалением
  if (data.Перетаскивание !== undefined) result.drag = data.Перетаскивание
  if (data.ПослеУдаления !== undefined) result.afterDeleteRow = data.ПослеУдаления
  if (data.ПриАктивизацииПоля !== undefined) result.onActivateField = data.ПриАктивизацииПоля
  if (data.ПриАктивизацииСтроки !== undefined) result.onActivateRow = data.ПриАктивизацииСтроки
  if (data.ПриАктивизацииЯчейки !== undefined) result.onActivateCell = data.ПриАктивизацииЯчейки
  if (data.ПриИзменении !== undefined) result.onChange = data.ПриИзменении
  if (data.ПриНачалеРедактирования !== undefined) result.onStartEdit = data.ПриНачалеРедактирования
  if (data.ПриОкончанииРедактирования !== undefined) result.onEditEnd = data.ПриОкончанииРедактирования
  if (data.ПриСменеТекущегоРодителя !== undefined) result.onCurrentParentChange = data.ПриСменеТекущегоРодителя
  if (data.ПроверкаПеретаскивания !== undefined) result.dragCheck = data.ПроверкаПеретаскивания

  return Object.keys(result).length > 0 ? result : undefined
}

export const importTableFromEnterprise = <From extends TableEnterprise | undefined, Name extends string>(
  context: ConfigurationContext,
  data: From,
  name: Name
): ImportFromEnterpriseReturn<From, Table, Name> => {
  if (!data) return undefined as ImportFromEnterpriseReturn<From, Table, Name>

  const baseElement = importBaseElementFromEnterprise(context, {} as From, name)
  if (!baseElement) return undefined as ImportFromEnterpriseReturn<From, Table, Name>

  const result: Table = {
    ...baseElement,
    elementType: FormElementType.Table,
    childItems: [],
  }

  const autoAddIncomplete = importBooleanFromEnterprise(context, data.АвтоВводНезаполненного)
  if (autoAddIncomplete !== undefined) result.autoAddIncomplete = autoAddIncomplete

  const autoInsertNewRow = importBooleanFromEnterprise(context, data.АвтоВводНовойСтроки)
  if (autoInsertNewRow !== undefined) result.autoInsertNewRow = autoInsertNewRow

  const autoCommandBar = importAutoCommandBarFromEnterprise(context, data.АвтоКоманднаяПанель)
  if (autoCommandBar !== undefined) result.autoCommandBar = autoCommandBar

  const autoMaxHeight = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяВысота)
  if (autoMaxHeight !== undefined) result.autoMaxHeight = autoMaxHeight

  const autoMaxHeightInTableRows = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяВысотаВСтрокахТаблицы)
  if (autoMaxHeightInTableRows !== undefined) result.autoMaxHeightInTableRows = autoMaxHeightInTableRows

  const autoMaxWidth = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяШирина)
  if (autoMaxWidth !== undefined) result.autoMaxWidth = autoMaxWidth

  const autoMarkIncomplete = importBooleanFromEnterprise(context, data.АвтоОтметкаНезаполненного)
  if (autoMarkIncomplete !== undefined) result.autoMarkIncomplete = autoMarkIncomplete

  const defaultItem = importBooleanFromEnterprise(context, data.АктивизироватьПоУмолчанию)
  if (defaultItem !== undefined) result.defaultItem = defaultItem

  const displayImportance = importSystemEnumerationFromEnterprise<SE.DisplayImportance>(
    context,
    data.ВажностьПриОтображении,
    SE.DisplayImportanceFromEnterprise
  )
  if (displayImportance !== undefined) result.displayImportance = displayImportance

  const heightControlVariant = importSystemEnumerationFromEnterprise<SE.TableHeightControlVariant>(
    context,
    data.ВариантУправленияВысотой,
    SE.TableHeightControlVariantFromEnterprise
  )
  if (heightControlVariant !== undefined) result.heightControlVariant = heightControlVariant

  const verticalScrollBar = importSystemEnumerationFromEnterprise<SE.ScrollBarUse>(
    context,
    data.ВертикальнаяПолосаПрокрутки,
    SE.ScrollBarUseFromEnterprise
  )
  if (verticalScrollBar !== undefined) result.verticalScrollBar = verticalScrollBar

  const verticalAlignInGroup = importSystemEnumerationFromEnterprise<SE.ItemVerticalAlign>(
    context,
    data.ВертикальноеПоложениеВГруппе,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.verticalAlignInGroup = verticalAlignInGroup

  const verticalLines = importBooleanFromEnterprise(context, data.ВертикальныеЛинии)
  if (verticalLines !== undefined) result.verticalLines = verticalLines

  const visible = importBooleanFromEnterprise(context, data.Видимость)
  if (visible !== undefined) result.visible = visible

  const output = importSystemEnumerationFromEnterprise<SE.UseOutput>(context, data.Вывод, SE.UseOutputFromEnterprise)
  if (output !== undefined) result.output = output

  if (data.Высота !== undefined) result.height = data.Высота

  if (data.ВысотаВСтрокахТаблицы !== undefined) result.heightInTableRows = data.ВысотаВСтрокахТаблицы

  if (data.ВысотаЗаголовка !== undefined) result.titleHeight = data.ВысотаЗаголовка

  if (data.ВысотаПодвала !== undefined) result.footerHeight = data.ВысотаПодвала

  if (data.ВысотаШапки !== undefined) result.headerHeight = data.ВысотаШапки

  const horizontalScrollBar = importSystemEnumerationFromEnterprise<SE.ScrollBarUse>(
    context,
    data.ГоризонтальнаяПолосаПрокрутки,
    SE.ScrollBarUseFromEnterprise
  )
  if (horizontalScrollBar !== undefined) result.horizontalScrollBar = horizontalScrollBar

  const horizontalAlignInGroup = importSystemEnumerationFromEnterprise<SE.ItemHorizontalLocation>(
    context,
    data.ГоризонтальноеПоложениеВГруппе,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.horizontalAlignInGroup = horizontalAlignInGroup

  const horizontalLines = importBooleanFromEnterprise(context, data.ГоризонтальныеЛинии)
  if (horizontalLines !== undefined) result.horizontalLines = horizontalLines

  const enabled = importBooleanFromEnterprise(context, data.Доступность)
  if (enabled !== undefined) result.enabled = enabled

  const title = importI8nTextFromEnterprise(context, data.Заголовок)
  if (title !== undefined) result.title = title

  const refreshRequest = importSystemEnumerationFromEnterprise<SE.RefreshRequestMethod>(
    context,
    data.ЗапросОбновления,
    SE.RefreshRequestMethodFromEnterprise
  )
  if (refreshRequest !== undefined) result.refreshRequest = refreshRequest

  const changeRowOrder = importBooleanFromEnterprise(context, data.ИзменятьПорядокСтрок)
  if (changeRowOrder !== undefined) result.changeRowOrder = changeRowOrder

  const changeRowSet = importBooleanFromEnterprise(context, data.ИзменятьСоставСтрок)
  if (changeRowSet !== undefined) result.changeRowSet = changeRowSet

  const currentRowUse = importSystemEnumerationFromEnterprise<SE.TableCurrentRowUse>(
    context,
    data.ИспользованиеТекущейСтроки,
    SE.TableCurrentRowUseFromEnterprise
  )
  if (currentRowUse !== undefined) result.currentRowUse = currentRowUse

  const rowsPicture = importBooleanFromEnterprise(context, data.КартинкаСтрок)
  if (rowsPicture !== undefined) result.rowsPicture = rowsPicture

  const commandSet = importCommandSetFromEnterprise(context, data.Команда)
  if (commandSet !== undefined) result.commandSet = commandSet

  const contextMenu = importContextMenuFromEnterprise(context, data.КонтекстноеМеню)
  if (contextMenu !== undefined) result.contextMenu = contextMenu

  if (data.МаксимальнаяВысота !== undefined) result.maxHeight = data.МаксимальнаяВысота

  if (data.МаксимальнаяВысотаВСтрокахТаблицы !== undefined)
    result.maxHeightInTableRows = data.МаксимальнаяВысотаВСтрокахТаблицы

  if (data.МаксимальнаяШирина !== undefined) result.maxWidth = data.МаксимальнаяШирина

  const multipleChoice = importBooleanFromEnterprise(context, data.МножественныйВыбор)
  if (multipleChoice !== undefined) result.multipleChoice = multipleChoice

  const initialTreeView = importSystemEnumerationFromEnterprise<SE.InitialTreeView>(
    context,
    data.НачальноеОтображениеДерева,
    SE.InitialTreeViewFromEnterprise
  )
  if (initialTreeView !== undefined) result.initialTreeView = initialTreeView

  const initialListView = importSystemEnumerationFromEnterprise<SE.InitialListView>(
    context,
    data.НачальноеОтображениеСписка,
    SE.InitialListViewFromEnterprise
  )
  if (initialListView !== undefined) result.initialListView = initialListView

  const markIncomplete = importBooleanFromEnterprise(context, data.ОтметкаНезаполненного)
  if (markIncomplete !== undefined) result.markIncomplete = markIncomplete

  const representation = importSystemEnumerationFromEnterprise<SE.TableRepresentation>(
    context,
    data.Отображение,
    SE.TableRepresentationFromEnterprise
  )
  if (representation !== undefined) result.representation = representation

  const toolTipRepresentation = importSystemEnumerationFromEnterprise<SE.ToolTipRepresentation>(
    context,
    data.ОтображениеПодсказки,
    SE.ToolTipRepresentationFromEnterprise
  )
  if (toolTipRepresentation !== undefined) result.toolTipRepresentation = toolTipRepresentation

  const viewStatusRepresentation = importViewStatusAdditionFromEnterprise(context, data.ОтображениеСостоянияПросмотра)
  if (viewStatusRepresentation !== undefined) result.viewStatusRepresentation = viewStatusRepresentation

  const searchStringRepresentation = importSearchStringAdditionFromEnterprise(context, data.ОтображениеСтрокиПоиска)
  if (searchStringRepresentation !== undefined) result.searchStringRepresentation = searchStringRepresentation

  const behaviorOnHorizontalCompression =
    importSystemEnumerationFromEnterprise<SE.TableBehaviorOnHorizontalCompression>(
      context,
      data.ПоведениеПриСжатииПоГоризонтали,
      SE.TableBehaviorOnHorizontalCompressionFromEnterprise
    )
  if (behaviorOnHorizontalCompression !== undefined)
    result.behaviorOnHorizontalCompression = behaviorOnHorizontalCompression

  const footer = importBooleanFromEnterprise(context, data.Подвал)
  if (footer !== undefined) result.footer = footer

  const toolTip = importI8nTextFromEnterprise(context, data.Подсказка)
  if (toolTip !== undefined) result.toolTip = toolTip

  // const childItems = importChildItemsFromEnterprise(context, data.ПодчиненныеЭлементы)
  // if (childItems !== undefined) result.childItems = childItems

  const searchOnInput = importSystemEnumerationFromEnterprise<SE.SearchInTableOnInput>(
    context,
    data.ПоискПриВводе,
    SE.SearchInTableOnInputFromEnterprise
  )
  if (searchOnInput !== undefined) result.searchOnInput = searchOnInput

  const titleLocation = importSystemEnumerationFromEnterprise<SE.FormItemTitleLocation>(
    context,
    data.ПоложениеЗаголовка,
    SE.FormItemTitleLocationFromEnterprise
  )
  if (titleLocation !== undefined) result.titleLocation = titleLocation

  const commandBarLocation = importSystemEnumerationFromEnterprise<SE.FormItemCommandBarLabelLocation>(
    context,
    data.ПоложениеКоманднойПанели,
    SE.FormItemCommandBarLabelLocationFromEnterprise
  )
  if (commandBarLocation !== undefined) result.commandBarLocation = commandBarLocation

  const viewStatusLocation = importSystemEnumerationFromEnterprise<SE.ViewStatusLocation>(
    context,
    data.ПоложениеСостоянияПросмотра,
    SE.ViewStatusLocationFromEnterprise
  )
  if (viewStatusLocation !== undefined) result.viewStatusLocation = viewStatusLocation

  const searchStringLocation = importSystemEnumerationFromEnterprise<SE.SearchStringLocation>(
    context,
    data.ПоложениеСтрокиПоиска,
    SE.SearchStringLocationFromEnterprise
  )
  if (searchStringLocation !== undefined) result.searchStringLocation = searchStringLocation

  const searchControlLocation = importSystemEnumerationFromEnterprise<SE.SearchControlLocation>(
    context,
    data.ПоложениеУправленияПоиском,
    SE.SearchControlLocationFromEnterprise
  )
  if (searchControlLocation !== undefined) result.searchControlLocation = searchControlLocation

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

  const skipOnInput = importBooleanFromEnterprise(context, data.ПропускатьПриВводе)
  if (skipOnInput !== undefined) result.skipOnInput = skipOnInput

  if (data.ПутьКДанным !== undefined) result.dataPath = data.ПутьКДанным

  if (data.ПутьКДаннымКартинкиСтроки !== undefined) result.rowPictureDataPath = data.ПутьКДаннымКартинкиСтроки

  const enableStartDrag = importBooleanFromEnterprise(context, data.РазрешитьНачалоПеретаскивания)
  if (enableStartDrag !== undefined) result.enableStartDrag = enableStartDrag

  const enableDrag = importBooleanFromEnterprise(context, data.РазрешитьПеретаскивание)
  if (enableDrag !== undefined) result.enableDrag = enableDrag

  const verticalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоВертикали)
  if (verticalStretch !== undefined) result.verticalStretch = verticalStretch

  const horizontalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  const extendedTooltip = importExtendedTooltipFromEnterprise(context, data.РасширеннаяПодсказка)
  if (extendedTooltip !== undefined) result.extendedTooltip = extendedTooltip

  const rowInputMode = importSystemEnumerationFromEnterprise<SE.TableRowInputMode>(
    context,
    data.РежимВводаСтрок,
    SE.TableRowInputModeFromEnterprise
  )
  if (rowInputMode !== undefined) result.rowInputMode = rowInputMode

  const choiceMode = importBooleanFromEnterprise(context, data.РежимВыбора)
  if (choiceMode !== undefined) result.choiceMode = choiceMode

  const selectionMode = importSystemEnumerationFromEnterprise<SE.TableSelectionMode>(
    context,
    data.РежимВыделения,
    SE.TableSelectionModeFromEnterprise
  )
  if (selectionMode !== undefined) result.selectionMode = selectionMode

  const rowSelectionMode = importSystemEnumerationFromEnterprise<SE.TableRowSelectionMode>(
    context,
    data.РежимВыделенияСтроки,
    SE.TableRowSelectionModeFromEnterprise
  )
  if (rowSelectionMode !== undefined) result.rowSelectionMode = rowSelectionMode

  if (data.СочетаниеКлавиш !== undefined) result.shortcut = data.СочетаниеКлавиш

  const fileDragMode = importSystemEnumerationFromEnterprise<SE.FileDragMode>(
    context,
    data.СпособПеретаскиванияФайлов,
    SE.FileDragModeFromEnterprise
  )
  if (fileDragMode !== undefined) result.fileDragMode = fileDragMode

  const readOnly = importBooleanFromEnterprise(context, data.ТолькоПросмотр)
  if (readOnly !== undefined) result.readOnly = readOnly

  const searchControl = importSearchControlAdditionFromEnterprise(context, data.УправлениеПоиском)
  if (searchControl !== undefined) result.searchControl = searchControl

  const borderColor = importColorFromEnterprise(context, data.ЦветРамки)
  if (borderColor !== undefined) result.borderColor = borderColor

  const textColor = importColorFromEnterprise(context, data.ЦветТекста)
  if (textColor !== undefined) result.textColor = textColor

  const titleTextColor = importColorFromEnterprise(context, data.ЦветТекстаЗаголовка)
  if (titleTextColor !== undefined) result.titleTextColor = titleTextColor

  const backColor = importColorFromEnterprise(context, data.ЦветФона)
  if (backColor !== undefined) result.backColor = backColor

  const useAlternationRowColor = importBooleanFromEnterprise(context, data.ЧередованиеЦветовСтрок)
  if (useAlternationRowColor !== undefined) result.useAlternationRowColor = useAlternationRowColor

  const header = importBooleanFromEnterprise(context, data.Шапка)
  if (header !== undefined) result.header = header

  if (data.Ширина !== undefined) result.width = data.Ширина

  const font = importFontFromEnterprise(context, data.Шрифт)
  if (font !== undefined) result.font = font

  const titleFont = importFontFromEnterprise(context, data.ШрифтЗаголовка)
  if (titleFont !== undefined) result.titleFont = titleFont

  const events = importTableEventsFromEnterprise(data.События)
  if (events !== undefined) result.events = events

  return result as ImportFromEnterpriseReturn<From, Table, Name>
}

registerMetadata("ImportFromEnterprise", "Table", importTableFromEnterprise)
