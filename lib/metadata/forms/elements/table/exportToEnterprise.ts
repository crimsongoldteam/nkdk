import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { exportCommandSetToEnterprise } from "~/lib/metadata/forms/commandSet/exportToEnterprise"
import { exportBaseElementToEnterprise } from "~/lib/metadata/forms/elements/baseElement/exportToEnterprise"
import { exportChildItemsToEnterprise } from "~/lib/metadata/forms/elements/childItems/exportToEnterprise"
import { exportCommandBarToEnterprise } from "~/lib/metadata/forms/elements/commandBar/exportToEnterprise"
import { exportFormDecorationToEnterprise } from "~/lib/metadata/forms/elements/formDecoration/exportToEnterprise"
import { exportFormItemAdditionToEnterprise } from "~/lib/metadata/forms/elements/formItemAddition/exportToEnterprise"
import { Table, TableEnterprise } from "~/lib/metadata/forms/elements/table/types"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportTableToEnterprise = (data: Table | undefined): TableEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportBaseElementToEnterprise(data)!,

    АвтоВводНезаполненного: exportBooleanToEnterprise(data.autoAddIncomplete),
    АвтоКоманднаяПанель: exportCommandBarToEnterprise(data.autoCommandBar),
    АвтоВводНовойСтроки: exportBooleanToEnterprise(data.autoInsertNewRow),
    АвтоОтметкаНезаполненного: exportBooleanToEnterprise(data.autoMarkIncomplete),
    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(data.autoMaxHeight),
    АвтоМаксимальнаяВысотаВСтрокахТаблицы: exportBooleanToEnterprise(data.autoMaxHeightInTableRows),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth),
    ЦветФона: exportColorToEnterprise(data.backColor),
    ПоведениеПриСжатииПоГоризонтали: exportSystemEnumerationToEnterprise(
      data.behaviorOnHorizontalCompression,
      SE.TableBehaviorOnHorizontalCompressionToEnterprise
    ),
    ЦветРамки: exportColorToEnterprise(data.borderColor),
    ИзменятьПорядокСтрок: exportBooleanToEnterprise(data.changeRowOrder),
    ИзменятьСоставСтрок: exportBooleanToEnterprise(data.changeRowSet),
    РежимВыбора: exportBooleanToEnterprise(data.choiceMode),
    КоманднаяПанель: exportCommandBarToEnterprise(data.commandBar),
    ПоложениеКоманднойПанели: exportSystemEnumerationToEnterprise(
      data.commandBarLocation,
      SE.FormItemCommandBarLabelLocationToEnterprise
    ),
    Команда: exportCommandSetToEnterprise(data.commandSet),
    КонтекстноеМеню: exportCommandBarToEnterprise(data.contextMenu),
    ИспользованиеТекущейСтроки: exportSystemEnumerationToEnterprise(
      data.currentRowUse,
      SE.TableCurrentRowUseToEnterprise
    ),
    ПутьКДанным: data.dataPath,
    АктивизироватьПоУмолчанию: exportBooleanToEnterprise(data.defaultItem),
    ВажностьПриОтображении: exportSystemEnumerationToEnterprise(
      data.displayImportance,
      SE.DisplayImportanceToEnterprise
    ),
    Доступность: exportBooleanToEnterprise(data.enabled),
    РазрешитьПеретаскивание: exportBooleanToEnterprise(data.enableDrag),
    РазрешитьНачалоПеретаскивания: exportBooleanToEnterprise(data.enableStartDrag),
    РасширеннаяПодсказка: exportFormDecorationToEnterprise(data.extendedTooltip),
    СпособПеретаскиванияФайлов: exportSystemEnumerationToEnterprise(data.fileDragMode, SE.FileDragModeToEnterprise),
    Шрифт: exportFontToEnterprise(data.font),
    Подвал: exportBooleanToEnterprise(data.footer),
    ВысотаПодвала: data.footerHeight,
    Шапка: exportBooleanToEnterprise(data.header),
    ВысотаШапки: data.headerHeight,
    Высота: data.height,
    ВариантУправленияВысотой: exportSystemEnumerationToEnterprise(
      data.heightControlVariant,
      SE.TableHeightControlVariantToEnterprise
    ),
    ВысотаВСтрокахТаблицы: data.heightInTableRows,
    ГоризонтальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      data.horizontalAlignInGroup,
      SE.ItemHorizontalLocationToEnterprise
    ),
    ГоризонтальныеЛинии: exportBooleanToEnterprise(data.horizontalLines),
    ГоризонтальнаяПолосаПрокрутки: exportSystemEnumerationToEnterprise(
      data.horizontalScrollBar,
      SE.ScrollBarUseToEnterprise
    ),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch),
    НачальноеОтображениеСписка: exportSystemEnumerationToEnterprise(
      data.initialListView,
      SE.InitialListViewToEnterprise
    ),
    НачальноеОтображениеДерева: exportSystemEnumerationToEnterprise(
      data.initialTreeView,
      SE.InitialTreeViewToEnterprise
    ),
    ОтметкаНезаполненного: exportBooleanToEnterprise(data.markIncomplete),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяВысотаВСтрокахТаблицы: data.maxHeightInTableRows,
    МаксимальнаяШирина: data.maxWidth,
    МножественныйВыбор: exportBooleanToEnterprise(data.multipleChoice),
    Вывод: exportSystemEnumerationToEnterprise(data.output, SE.UseOutputToEnterprise),
    ТолькоПросмотр: exportBooleanToEnterprise(data.readOnly),
    ЗапросОбновления: exportSystemEnumerationToEnterprise(data.refreshRequest, SE.RefreshRequestMethodToEnterprise),
    Отображение: exportSystemEnumerationToEnterprise(data.representation, SE.TableRepresentationToEnterprise),
    РежимВводаСтрок: exportSystemEnumerationToEnterprise(data.rowInputMode, SE.TableRowInputModeToEnterprise),
    ПутьКДаннымКартинкиСтроки: data.rowPictureDataPath,
    РежимВыделенияСтроки: exportSystemEnumerationToEnterprise(
      data.rowSelectionMode,
      SE.TableRowSelectionModeToEnterprise
    ),
    КартинкаСтрок: exportBooleanToEnterprise(data.rowsPicture),
    УправлениеПоиском: exportFormItemAdditionToEnterprise(data.searchControl),
    ПоложениеУправленияПоиском: exportSystemEnumerationToEnterprise(
      data.searchControlLocation,
      SE.SearchControlLocationToEnterprise
    ),
    ПоискПриВводе: exportSystemEnumerationToEnterprise(data.searchOnInput, SE.SearchInTableOnInputToEnterprise),
    ПоложениеСтрокиПоиска: exportSystemEnumerationToEnterprise(
      data.searchStringLocation,
      SE.SearchStringLocationToEnterprise
    ),
    ОтображениеСтрокиПоиска: exportFormItemAdditionToEnterprise(data.searchStringRepresentation),
    РежимВыделения: exportSystemEnumerationToEnterprise(data.selectionMode, SE.TableSelectionModeToEnterprise),
    СочетаниеКлавиш: data.shortcut,
    ПропускатьПриВводе: exportBooleanToEnterprise(data.skipOnInput),
    ЦветТекста: exportColorToEnterprise(data.textColor),
    Заголовок: exportI8nTextToEnterprise(data.title),
    ШрифтЗаголовка: exportFontToEnterprise(data.titleFont),
    ВысотаЗаголовка: data.titleHeight,
    ПоложениеЗаголовка: exportSystemEnumerationToEnterprise(data.titleLocation, SE.FormItemTitleLocationToEnterprise),
    ЦветТекстаЗаголовка: exportColorToEnterprise(data.titleTextColor),
    Подсказка: exportI8nTextToEnterprise(data.toolTip),
    ОтображениеПодсказки: exportSystemEnumerationToEnterprise(
      data.toolTipRepresentation,
      SE.ToolTipRepresentationToEnterprise
    ),
    ЧередованиеЦветовСтрок: exportBooleanToEnterprise(data.useAlternationRowColor),
    ВертикальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      data.verticalAlignInGroup,
      SE.ItemVerticalAlignToEnterprise
    ),
    ВертикальныеЛинии: exportBooleanToEnterprise(data.verticalLines),
    ВертикальнаяПолосаПрокрутки: exportSystemEnumerationToEnterprise(
      data.verticalScrollBar,
      SE.ScrollBarUseToEnterprise
    ),
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch),
    ПоложениеСостоянияПросмотра: exportSystemEnumerationToEnterprise(
      data.viewStatusLocation,
      SE.ViewStatusLocationToEnterprise
    ),
    ОтображениеСостоянияПросмотра: exportFormItemAdditionToEnterprise(data.viewStatusRepresentation),
    Видимость: exportBooleanToEnterprise(data.visible),
    Ширина: data.width,
    ПодчиненныеЭлементы: exportChildItemsToEnterprise(data.childItems),
    ПользовательскаяВидимость: exportUserVisibleToEnterprise(data.userVisible),
    Events: exportEventsToEnterprise(data.events),
  }
}

registerEnterpriseExport(FormElementType.Table, exportTableToEnterprise)
