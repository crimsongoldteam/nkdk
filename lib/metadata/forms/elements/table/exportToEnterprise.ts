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
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportTableToEnterprise = (
  data: Table | undefined,
  configurationSettings: ConfigurationSettings
): TableEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportBaseElementToEnterprise(data, configurationSettings)!,

    АвтоВводНезаполненного: exportBooleanToEnterprise(data.autoAddIncomplete, configurationSettings),
    АвтоВводНовойСтроки: exportBooleanToEnterprise(data.autoInsertNewRow, configurationSettings),
    АвтоКоманднаяПанель: exportCommandBarToEnterprise(data.autoCommandBar, configurationSettings),
    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(data.autoMaxHeight, configurationSettings),
    АвтоМаксимальнаяВысотаВСтрокахТаблицы: exportBooleanToEnterprise(
      data.autoMaxHeightInTableRows,
      configurationSettings
    ),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth, configurationSettings),
    АвтоОтметкаНезаполненного: exportBooleanToEnterprise(data.autoMarkIncomplete, configurationSettings),
    АктивизироватьПоУмолчанию: exportBooleanToEnterprise(data.defaultItem, configurationSettings),
    ВажностьПриОтображении: exportSystemEnumerationToEnterprise(
      data.displayImportance,
      SE.DisplayImportanceToEnterprise,
      configurationSettings
    ),
    ВариантУправленияВысотой: exportSystemEnumerationToEnterprise(
      data.heightControlVariant,
      SE.TableHeightControlVariantToEnterprise,
      configurationSettings
    ),
    ВертикальнаяПолосаПрокрутки: exportSystemEnumerationToEnterprise(
      data.verticalScrollBar,
      SE.ScrollBarUseToEnterprise,
      configurationSettings
    ),
    ВертикальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      data.verticalAlignInGroup,
      SE.ItemVerticalAlignToEnterprise,
      configurationSettings
    ),
    ВертикальныеЛинии: exportBooleanToEnterprise(data.verticalLines, configurationSettings),
    Видимость: exportBooleanToEnterprise(data.visible, configurationSettings),
    Вывод: exportSystemEnumerationToEnterprise(data.output, SE.UseOutputToEnterprise, configurationSettings),
    Высота: data.height,
    ВысотаВСтрокахТаблицы: data.heightInTableRows,
    ВысотаЗаголовка: data.titleHeight,
    ВысотаПодвала: data.footerHeight,
    ВысотаШапки: data.headerHeight,
    ГоризонтальнаяПолосаПрокрутки: exportSystemEnumerationToEnterprise(
      data.horizontalScrollBar,
      SE.ScrollBarUseToEnterprise,
      configurationSettings
    ),
    ГоризонтальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      data.horizontalAlignInGroup,
      SE.ItemHorizontalLocationToEnterprise,
      configurationSettings
    ),
    ГоризонтальныеЛинии: exportBooleanToEnterprise(data.horizontalLines, configurationSettings),
    Доступность: exportBooleanToEnterprise(data.enabled, configurationSettings),
    Заголовок: exportI8nTextToEnterprise(data.title, configurationSettings),
    ЗапросОбновления: exportSystemEnumerationToEnterprise(
      data.refreshRequest,
      SE.RefreshRequestMethodToEnterprise,
      configurationSettings
    ),
    ИзменятьПорядокСтрок: exportBooleanToEnterprise(data.changeRowOrder, configurationSettings),
    ИзменятьСоставСтрок: exportBooleanToEnterprise(data.changeRowSet, configurationSettings),
    ИспользованиеТекущейСтроки: exportSystemEnumerationToEnterprise(
      data.currentRowUse,
      SE.TableCurrentRowUseToEnterprise,
      configurationSettings
    ),
    КартинкаСтрок: exportBooleanToEnterprise(data.rowsPicture, configurationSettings),
    Команда: exportCommandSetToEnterprise(data.commandSet, configurationSettings),
    КоманднаяПанель: exportCommandBarToEnterprise(data.commandBar, configurationSettings),
    КонтекстноеМеню: exportCommandBarToEnterprise(data.contextMenu, configurationSettings),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяВысотаВСтрокахТаблицы: data.maxHeightInTableRows,
    МаксимальнаяШирина: data.maxWidth,
    МножественныйВыбор: exportBooleanToEnterprise(data.multipleChoice, configurationSettings),
    НачальноеОтображениеДерева: exportSystemEnumerationToEnterprise(
      data.initialTreeView,
      SE.InitialTreeViewToEnterprise,
      configurationSettings
    ),
    НачальноеОтображениеСписка: exportSystemEnumerationToEnterprise(
      data.initialListView,
      SE.InitialListViewToEnterprise,
      configurationSettings
    ),
    ОтметкаНезаполненного: exportBooleanToEnterprise(data.markIncomplete, configurationSettings),
    Отображение: exportSystemEnumerationToEnterprise(
      data.representation,
      SE.TableRepresentationToEnterprise,
      configurationSettings
    ),
    ОтображениеПодсказки: exportSystemEnumerationToEnterprise(
      data.toolTipRepresentation,
      SE.ToolTipRepresentationToEnterprise,
      configurationSettings
    ),
    ОтображениеСостоянияПросмотра: exportFormItemAdditionToEnterprise(
      data.viewStatusRepresentation,
      configurationSettings
    ),
    ОтображениеСтрокиПоиска: exportFormItemAdditionToEnterprise(data.searchStringRepresentation, configurationSettings),
    ПоведениеПриСжатииПоГоризонтали: exportSystemEnumerationToEnterprise(
      data.behaviorOnHorizontalCompression,
      SE.TableBehaviorOnHorizontalCompressionToEnterprise,
      configurationSettings
    ),
    Подвал: exportBooleanToEnterprise(data.footer, configurationSettings),
    Подсказка: exportI8nTextToEnterprise(data.toolTip, configurationSettings),
    ПодчиненныеЭлементы: exportChildItemsToEnterprise(data.childItems, configurationSettings),
    ПоискПриВводе: exportSystemEnumerationToEnterprise(
      data.searchOnInput,
      SE.SearchInTableOnInputToEnterprise,
      configurationSettings
    ),
    ПоложениеЗаголовка: exportSystemEnumerationToEnterprise(
      data.titleLocation,
      SE.FormItemTitleLocationToEnterprise,
      configurationSettings
    ),
    ПоложениеКоманднойПанели: exportSystemEnumerationToEnterprise(
      data.commandBarLocation,
      SE.FormItemCommandBarLabelLocationToEnterprise,
      configurationSettings
    ),
    ПоложениеСостоянияПросмотра: exportSystemEnumerationToEnterprise(
      data.viewStatusLocation,
      SE.ViewStatusLocationToEnterprise,
      configurationSettings
    ),
    ПоложениеСтрокиПоиска: exportSystemEnumerationToEnterprise(
      data.searchStringLocation,
      SE.SearchStringLocationToEnterprise,
      configurationSettings
    ),
    ПоложениеУправленияПоиском: exportSystemEnumerationToEnterprise(
      data.searchControlLocation,
      SE.SearchControlLocationToEnterprise,
      configurationSettings
    ),
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
    ПропускатьПриВводе: exportBooleanToEnterprise(data.skipOnInput, configurationSettings),
    ПутьКДанным: data.dataPath,
    ПутьКДаннымКартинкиСтроки: data.rowPictureDataPath,
    РазрешитьНачалоПеретаскивания: exportBooleanToEnterprise(data.enableStartDrag, configurationSettings),
    РазрешитьПеретаскивание: exportBooleanToEnterprise(data.enableDrag, configurationSettings),
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch, configurationSettings),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch, configurationSettings),
    РасширеннаяПодсказка: exportFormDecorationToEnterprise(data.extendedTooltip, configurationSettings),
    РежимВводаСтрок: exportSystemEnumerationToEnterprise(
      data.rowInputMode,
      SE.TableRowInputModeToEnterprise,
      configurationSettings
    ),
    РежимВыбора: exportBooleanToEnterprise(data.choiceMode, configurationSettings),
    РежимВыделения: exportSystemEnumerationToEnterprise(
      data.selectionMode,
      SE.TableSelectionModeToEnterprise,
      configurationSettings
    ),
    РежимВыделенияСтроки: exportSystemEnumerationToEnterprise(
      data.rowSelectionMode,
      SE.TableRowSelectionModeToEnterprise,
      configurationSettings
    ),
    СочетаниеКлавиш: data.shortcut,
    СпособПеретаскиванияФайлов: exportSystemEnumerationToEnterprise(
      data.fileDragMode,
      SE.FileDragModeToEnterprise,
      configurationSettings
    ),
    ТолькоПросмотр: exportBooleanToEnterprise(data.readOnly, configurationSettings),
    УправлениеПоиском: exportFormItemAdditionToEnterprise(data.searchControl, configurationSettings),
    ЦветРамки: exportColorToEnterprise(data.borderColor, configurationSettings),
    ЦветТекста: exportColorToEnterprise(data.textColor, configurationSettings),
    ЦветТекстаЗаголовка: exportColorToEnterprise(data.titleTextColor, configurationSettings),
    ЦветФона: exportColorToEnterprise(data.backColor, configurationSettings),
    ЧередованиеЦветовСтрок: exportBooleanToEnterprise(data.useAlternationRowColor, configurationSettings),
    Шапка: exportBooleanToEnterprise(data.header, configurationSettings),
    Ширина: data.width,
    Шрифт: exportFontToEnterprise(data.font, configurationSettings),
    ШрифтЗаголовка: exportFontToEnterprise(data.titleFont, configurationSettings),
    События: exportEventsToEnterprise(data.events, configurationSettings),
  })
}

registerMetadata("ExportToEnterprise", "Table", exportTableToEnterprise)
