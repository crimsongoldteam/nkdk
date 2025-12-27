import { exportBooleanToEnterprise } from "~/packages/core/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/packages/core/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/packages/core/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/packages/core/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/packages/core/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/packages/core/metadata/context/types"
import { exportCommandSetToEnterprise } from "~/packages/core/metadata/forms/commandSet/exportToEnterprise"
import { exportBaseElementToEnterprise } from "~/packages/core/metadata/forms/elements/baseElement/exportToEnterprise"
import { exportChildItemsToEnterprise } from "~/packages/core/metadata/forms/elements/childItems/exportToEnterprise"
import { exportCommandBarToEnterprise } from "~/packages/core/metadata/forms/elements/commandBar/exportToEnterprise"
import { exportFormDecorationToEnterprise } from "~/packages/core/metadata/forms/elements/formDecoration/exportToEnterprise"
import { exportFormItemAdditionToEnterprise } from "~/packages/core/metadata/forms/elements/formItemAddition/exportToEnterprise"
import { Table, TableEnterprise } from "~/packages/core/metadata/forms/elements/table/types"
import { exportEventsToEnterprise } from "~/packages/core/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/packages/core/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/packages/core/metadata/systemEnumerations/types"

export const exportTableToEnterprise = (context: Context, data: Table | undefined): TableEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportBaseElementToEnterprise(context, data)!,

    АвтоВводНезаполненного: exportBooleanToEnterprise(context, data.autoAddIncomplete),
    АвтоВводНовойСтроки: exportBooleanToEnterprise(context, data.autoInsertNewRow),
    АвтоКоманднаяПанель: exportCommandBarToEnterprise(context, data.autoCommandBar),
    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(context, data.autoMaxHeight),
    АвтоМаксимальнаяВысотаВСтрокахТаблицы: exportBooleanToEnterprise(context, data.autoMaxHeightInTableRows),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(context, data.autoMaxWidth),
    АвтоОтметкаНезаполненного: exportBooleanToEnterprise(context, data.autoMarkIncomplete),
    АктивизироватьПоУмолчанию: exportBooleanToEnterprise(context, data.defaultItem),
    ВажностьПриОтображении: exportSystemEnumerationToEnterprise(
      context,
      data.displayImportance,
      SE.DisplayImportanceToEnterprise
    ),
    ВариантУправленияВысотой: exportSystemEnumerationToEnterprise(
      context,
      data.heightControlVariant,
      SE.TableHeightControlVariantToEnterprise
    ),
    ВертикальнаяПолосаПрокрутки: exportSystemEnumerationToEnterprise(
      context,
      data.verticalScrollBar,
      SE.ScrollBarUseToEnterprise
    ),
    ВертикальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      context,
      data.verticalAlignInGroup,
      SE.ItemVerticalAlignToEnterprise
    ),
    ВертикальныеЛинии: exportBooleanToEnterprise(context, data.verticalLines),
    Видимость: exportBooleanToEnterprise(context, data.visible),
    Вывод: exportSystemEnumerationToEnterprise(context, data.output, SE.UseOutputToEnterprise),
    Высота: data.height,
    ВысотаВСтрокахТаблицы: data.heightInTableRows,
    ВысотаЗаголовка: data.titleHeight,
    ВысотаПодвала: data.footerHeight,
    ВысотаШапки: data.headerHeight,
    ГоризонтальнаяПолосаПрокрутки: exportSystemEnumerationToEnterprise(
      context,
      data.horizontalScrollBar,
      SE.ScrollBarUseToEnterprise
    ),
    ГоризонтальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      context,
      data.horizontalAlignInGroup,
      SE.ItemHorizontalLocationToEnterprise
    ),
    ГоризонтальныеЛинии: exportBooleanToEnterprise(context, data.horizontalLines),
    Доступность: exportBooleanToEnterprise(context, data.enabled),
    Заголовок: exportI8nTextToEnterprise(context, data.title),
    ЗапросОбновления: exportSystemEnumerationToEnterprise(
      context,
      data.refreshRequest,
      SE.RefreshRequestMethodToEnterprise
    ),
    ИзменятьПорядокСтрок: exportBooleanToEnterprise(context, data.changeRowOrder),
    ИзменятьСоставСтрок: exportBooleanToEnterprise(context, data.changeRowSet),
    ИспользованиеТекущейСтроки: exportSystemEnumerationToEnterprise(
      context,
      data.currentRowUse,
      SE.TableCurrentRowUseToEnterprise
    ),
    КартинкаСтрок: exportBooleanToEnterprise(context, data.rowsPicture),
    Команда: exportCommandSetToEnterprise(context, data.commandSet),
    КоманднаяПанель: exportCommandBarToEnterprise(context, data.commandBar),
    КонтекстноеМеню: exportCommandBarToEnterprise(context, data.contextMenu),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяВысотаВСтрокахТаблицы: data.maxHeightInTableRows,
    МаксимальнаяШирина: data.maxWidth,
    МножественныйВыбор: exportBooleanToEnterprise(context, data.multipleChoice),
    НачальноеОтображениеДерева: exportSystemEnumerationToEnterprise(
      context,
      data.initialTreeView,
      SE.InitialTreeViewToEnterprise
    ),
    НачальноеОтображениеСписка: exportSystemEnumerationToEnterprise(
      context,
      data.initialListView,
      SE.InitialListViewToEnterprise
    ),
    ОтметкаНезаполненного: exportBooleanToEnterprise(context, data.markIncomplete),
    Отображение: exportSystemEnumerationToEnterprise(context, data.representation, SE.TableRepresentationToEnterprise),
    ОтображениеПодсказки: exportSystemEnumerationToEnterprise(
      context,
      data.toolTipRepresentation,
      SE.ToolTipRepresentationToEnterprise
    ),
    ОтображениеСостоянияПросмотра: exportFormItemAdditionToEnterprise(context, data.viewStatusRepresentation),
    ОтображениеСтрокиПоиска: exportFormItemAdditionToEnterprise(context, data.searchStringRepresentation),
    ПоведениеПриСжатииПоГоризонтали: exportSystemEnumerationToEnterprise(
      context,
      data.behaviorOnHorizontalCompression,
      SE.TableBehaviorOnHorizontalCompressionToEnterprise
    ),
    Подвал: exportBooleanToEnterprise(context, data.footer),
    Подсказка: exportI8nTextToEnterprise(context, data.toolTip),
    ПодчиненныеЭлементы: exportChildItemsToEnterprise(context, data.childItems),
    ПоискПриВводе: exportSystemEnumerationToEnterprise(
      context,
      data.searchOnInput,
      SE.SearchInTableOnInputToEnterprise
    ),
    ПоложениеЗаголовка: exportSystemEnumerationToEnterprise(
      context,
      data.titleLocation,
      SE.FormItemTitleLocationToEnterprise
    ),
    ПоложениеКоманднойПанели: exportSystemEnumerationToEnterprise(
      context,
      data.commandBarLocation,
      SE.FormItemCommandBarLabelLocationToEnterprise
    ),
    ПоложениеСостоянияПросмотра: exportSystemEnumerationToEnterprise(
      context,
      data.viewStatusLocation,
      SE.ViewStatusLocationToEnterprise
    ),
    ПоложениеСтрокиПоиска: exportSystemEnumerationToEnterprise(
      context,
      data.searchStringLocation,
      SE.SearchStringLocationToEnterprise
    ),
    ПоложениеУправленияПоиском: exportSystemEnumerationToEnterprise(
      context,
      data.searchControlLocation,
      SE.SearchControlLocationToEnterprise
    ),
    ...exportUserVisibleToEnterprise(context, data.userVisible),
    ПропускатьПриВводе: exportBooleanToEnterprise(context, data.skipOnInput),
    ПутьКДанным: data.dataPath,
    ПутьКДаннымКартинкиСтроки: data.rowPictureDataPath,
    РазрешитьНачалоПеретаскивания: exportBooleanToEnterprise(context, data.enableStartDrag),
    РазрешитьПеретаскивание: exportBooleanToEnterprise(context, data.enableDrag),
    РастягиватьПоВертикали: exportBooleanToEnterprise(context, data.verticalStretch),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(context, data.horizontalStretch),
    РасширеннаяПодсказка: exportFormDecorationToEnterprise(context, data.extendedTooltip),
    РежимВводаСтрок: exportSystemEnumerationToEnterprise(context, data.rowInputMode, SE.TableRowInputModeToEnterprise),
    РежимВыбора: exportBooleanToEnterprise(context, data.choiceMode),
    РежимВыделения: exportSystemEnumerationToEnterprise(context, data.selectionMode, SE.TableSelectionModeToEnterprise),
    РежимВыделенияСтроки: exportSystemEnumerationToEnterprise(
      context,
      data.rowSelectionMode,
      SE.TableRowSelectionModeToEnterprise
    ),
    СочетаниеКлавиш: data.shortcut,
    СпособПеретаскиванияФайлов: exportSystemEnumerationToEnterprise(
      context,
      data.fileDragMode,
      SE.FileDragModeToEnterprise
    ),
    ТолькоПросмотр: exportBooleanToEnterprise(context, data.readOnly),
    УправлениеПоиском: exportFormItemAdditionToEnterprise(context, data.searchControl),
    ЦветРамки: exportColorToEnterprise(context, data.borderColor),
    ЦветТекста: exportColorToEnterprise(context, data.textColor),
    ЦветТекстаЗаголовка: exportColorToEnterprise(context, data.titleTextColor),
    ЦветФона: exportColorToEnterprise(context, data.backColor),
    ЧередованиеЦветовСтрок: exportBooleanToEnterprise(context, data.useAlternationRowColor),
    Шапка: exportBooleanToEnterprise(context, data.header),
    Ширина: data.width,
    Шрифт: exportFontToEnterprise(context, data.font),
    ШрифтЗаголовка: exportFontToEnterprise(context, data.titleFont),
    События: exportEventsToEnterprise(context, data.events),
  })
}

registerMetadata("ExportToEnterprise", "Table", exportTableToEnterprise)
