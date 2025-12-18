import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportCommandSetToEnterprise } from "~/lib/metadata/forms/commandSet/exportToEnterprise"
import { exportBaseElementToEnterprise } from "~/lib/metadata/forms/elements/baseElement/exportToEnterprise"
import { exportChildItemsToEnterprise } from "~/lib/metadata/forms/elements/childItems/exportToEnterprise"
import { exportCommandBarToEnterprise } from "~/lib/metadata/forms/elements/commandBar/exportToEnterprise"
import { exportFormDecorationToEnterprise } from "~/lib/metadata/forms/elements/formDecoration/exportToEnterprise"
import { exportFormItemAdditionToEnterprise } from "~/lib/metadata/forms/elements/formItemAddition/exportToEnterprise"
import { Table, TableEnterprise } from "~/lib/metadata/forms/elements/table/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportTableToEnterprise = (
  data: Table | undefined,
  configurationSettings: ConfigurationSettings
): TableEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportBaseElementToEnterprise(data, configurationSettings)!,

    АвтоВводНезаполненного: exportBooleanToEnterprise(data.autoAddIncomplete, configurationSettings),
    АвтоКоманднаяПанель: exportCommandBarToEnterprise(data.autoCommandBar, configurationSettings),
    АвтоВводНовойСтроки: exportBooleanToEnterprise(data.autoInsertNewRow, configurationSettings),
    АвтоОтметкаНезаполненного: exportBooleanToEnterprise(data.autoMarkIncomplete, configurationSettings),
    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(data.autoMaxHeight, configurationSettings),
    АвтоМаксимальнаяВысотаВСтрокахТаблицы: exportBooleanToEnterprise(
      data.autoMaxHeightInTableRows,
      configurationSettings
    ),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth, configurationSettings),
    ЦветФона: exportColorToEnterprise(data.backColor, configurationSettings),
    ПоведениеПриСжатииПоГоризонтали: exportSystemEnumerationToEnterprise(
      data.behaviorOnHorizontalCompression,
      SE.TableBehaviorOnHorizontalCompressionToEnterprise,
      configurationSettings
    ),
    ЦветРамки: exportColorToEnterprise(data.borderColor, configurationSettings),
    ИзменятьПорядокСтрок: exportBooleanToEnterprise(data.changeRowOrder, configurationSettings),
    ИзменятьСоставСтрок: exportBooleanToEnterprise(data.changeRowSet, configurationSettings),
    РежимВыбора: exportBooleanToEnterprise(data.choiceMode, configurationSettings),
    КоманднаяПанель: exportCommandBarToEnterprise(data.commandBar, configurationSettings),
    ПоложениеКоманднойПанели: exportSystemEnumerationToEnterprise(
      data.commandBarLocation,
      SE.FormItemCommandBarLabelLocationToEnterprise,
      configurationSettings
    ),
    Команда: exportCommandSetToEnterprise(data.commandSet, configurationSettings),
    КонтекстноеМеню: exportCommandBarToEnterprise(data.contextMenu, configurationSettings),
    ИспользованиеТекущейСтроки: exportSystemEnumerationToEnterprise(
      data.currentRowUse,
      SE.TableCurrentRowUseToEnterprise,
      configurationSettings
    ),
    ПутьКДанным: data.dataPath,
    АктивизироватьПоУмолчанию: exportBooleanToEnterprise(data.defaultItem, configurationSettings),
    ВажностьПриОтображении: exportSystemEnumerationToEnterprise(
      data.displayImportance,
      SE.DisplayImportanceToEnterprise,
      configurationSettings
    ),
    Доступность: exportBooleanToEnterprise(data.enabled, configurationSettings),
    РазрешитьПеретаскивание: exportBooleanToEnterprise(data.enableDrag, configurationSettings),
    РазрешитьНачалоПеретаскивания: exportBooleanToEnterprise(data.enableStartDrag, configurationSettings),
    РасширеннаяПодсказка: exportFormDecorationToEnterprise(data.extendedTooltip, configurationSettings),
    СпособПеретаскиванияФайлов: exportSystemEnumerationToEnterprise(
      data.fileDragMode,
      SE.FileDragModeToEnterprise,
      configurationSettings
    ),
    Шрифт: exportFontToEnterprise(data.font, configurationSettings),
    Подвал: exportBooleanToEnterprise(data.footer, configurationSettings),
    ВысотаПодвала: data.footerHeight,
    Шапка: exportBooleanToEnterprise(data.header, configurationSettings),
    ВысотаШапки: data.headerHeight,
    Высота: data.height,
    ВариантУправленияВысотой: exportSystemEnumerationToEnterprise(
      data.heightControlVariant,
      SE.TableHeightControlVariantToEnterprise,
      configurationSettings
    ),
    ВысотаВСтрокахТаблицы: data.heightInTableRows,
    ГоризонтальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      data.horizontalAlignInGroup,
      SE.ItemHorizontalLocationToEnterprise,
      configurationSettings
    ),
    ГоризонтальныеЛинии: exportBooleanToEnterprise(data.horizontalLines, configurationSettings),
    ГоризонтальнаяПолосаПрокрутки: exportSystemEnumerationToEnterprise(
      data.horizontalScrollBar,
      SE.ScrollBarUseToEnterprise,
      configurationSettings
    ),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch, configurationSettings),
    НачальноеОтображениеСписка: exportSystemEnumerationToEnterprise(
      data.initialListView,
      SE.InitialListViewToEnterprise,
      configurationSettings
    ),
    НачальноеОтображениеДерева: exportSystemEnumerationToEnterprise(
      data.initialTreeView,
      SE.InitialTreeViewToEnterprise,
      configurationSettings
    ),
    ОтметкаНезаполненного: exportBooleanToEnterprise(data.markIncomplete, configurationSettings),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяВысотаВСтрокахТаблицы: data.maxHeightInTableRows,
    МаксимальнаяШирина: data.maxWidth,
    МножественныйВыбор: exportBooleanToEnterprise(data.multipleChoice, configurationSettings),
    Вывод: exportSystemEnumerationToEnterprise(data.output, SE.UseOutputToEnterprise, configurationSettings),
    ТолькоПросмотр: exportBooleanToEnterprise(data.readOnly, configurationSettings),
    ЗапросОбновления: exportSystemEnumerationToEnterprise(
      data.refreshRequest,
      SE.RefreshRequestMethodToEnterprise,
      configurationSettings
    ),
    Отображение: exportSystemEnumerationToEnterprise(
      data.representation,
      SE.TableRepresentationToEnterprise,
      configurationSettings
    ),
    РежимВводаСтрок: exportSystemEnumerationToEnterprise(
      data.rowInputMode,
      SE.TableRowInputModeToEnterprise,
      configurationSettings
    ),
    ПутьКДаннымКартинкиСтроки: data.rowPictureDataPath,
    РежимВыделенияСтроки: exportSystemEnumerationToEnterprise(
      data.rowSelectionMode,
      SE.TableRowSelectionModeToEnterprise,
      configurationSettings
    ),
    КартинкаСтрок: exportBooleanToEnterprise(data.rowsPicture, configurationSettings),
    УправлениеПоиском: exportFormItemAdditionToEnterprise(data.searchControl, configurationSettings),
    ПоложениеУправленияПоиском: exportSystemEnumerationToEnterprise(
      data.searchControlLocation,
      SE.SearchControlLocationToEnterprise,
      configurationSettings
    ),
    ПоискПриВводе: exportSystemEnumerationToEnterprise(
      data.searchOnInput,
      SE.SearchInTableOnInputToEnterprise,
      configurationSettings
    ),
    ПоложениеСтрокиПоиска: exportSystemEnumerationToEnterprise(
      data.searchStringLocation,
      SE.SearchStringLocationToEnterprise,
      configurationSettings
    ),
    ОтображениеСтрокиПоиска: exportFormItemAdditionToEnterprise(data.searchStringRepresentation, configurationSettings),
    РежимВыделения: exportSystemEnumerationToEnterprise(
      data.selectionMode,
      SE.TableSelectionModeToEnterprise,
      configurationSettings
    ),
    СочетаниеКлавиш: data.shortcut,
    ПропускатьПриВводе: exportBooleanToEnterprise(data.skipOnInput, configurationSettings),
    ЦветТекста: exportColorToEnterprise(data.textColor, configurationSettings),
    Заголовок: exportI8nTextToEnterprise(data.title, configurationSettings),
    ШрифтЗаголовка: exportFontToEnterprise(data.titleFont, configurationSettings),
    ВысотаЗаголовка: data.titleHeight,
    ПоложениеЗаголовка: exportSystemEnumerationToEnterprise(
      data.titleLocation,
      SE.FormItemTitleLocationToEnterprise,
      configurationSettings
    ),
    ЦветТекстаЗаголовка: exportColorToEnterprise(data.titleTextColor, configurationSettings),
    Подсказка: exportI8nTextToEnterprise(data.toolTip, configurationSettings),
    ОтображениеПодсказки: exportSystemEnumerationToEnterprise(
      data.toolTipRepresentation,
      SE.ToolTipRepresentationToEnterprise,
      configurationSettings
    ),
    ЧередованиеЦветовСтрок: exportBooleanToEnterprise(data.useAlternationRowColor, configurationSettings),
    ВертикальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      data.verticalAlignInGroup,
      SE.ItemVerticalAlignToEnterprise,
      configurationSettings
    ),
    ВертикальныеЛинии: exportBooleanToEnterprise(data.verticalLines, configurationSettings),
    ВертикальнаяПолосаПрокрутки: exportSystemEnumerationToEnterprise(
      data.verticalScrollBar,
      SE.ScrollBarUseToEnterprise,
      configurationSettings
    ),
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch, configurationSettings),
    ПоложениеСостоянияПросмотра: exportSystemEnumerationToEnterprise(
      data.viewStatusLocation,
      SE.ViewStatusLocationToEnterprise,
      configurationSettings
    ),
    ОтображениеСостоянияПросмотра: exportFormItemAdditionToEnterprise(
      data.viewStatusRepresentation,
      configurationSettings
    ),
    Видимость: exportBooleanToEnterprise(data.visible, configurationSettings),
    Ширина: data.width,
    ПодчиненныеЭлементы: exportChildItemsToEnterprise(data.childItems, configurationSettings),
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
    События: exportEventsToEnterprise(data.events, configurationSettings),
  }
}

registerMetadata("ExportToEnterprise", "Table", exportTableToEnterprise)
