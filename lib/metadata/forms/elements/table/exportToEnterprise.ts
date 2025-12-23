import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/lib/metadata/context/types"
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
  configurationSettings: Context,
  data: Table | undefined
): TableEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportBaseElementToEnterprise(configurationSettings, data)!,

    АвтоВводНезаполненного: exportBooleanToEnterprise(configurationSettings, data.autoAddIncomplete),
    АвтоВводНовойСтроки: exportBooleanToEnterprise(configurationSettings, data.autoInsertNewRow),
    АвтоКоманднаяПанель: exportCommandBarToEnterprise(configurationSettings, data.autoCommandBar),
    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(configurationSettings, data.autoMaxHeight),
    АвтоМаксимальнаяВысотаВСтрокахТаблицы: exportBooleanToEnterprise(
      configurationSettings,
      data.autoMaxHeightInTableRows
    ),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(configurationSettings, data.autoMaxWidth),
    АвтоОтметкаНезаполненного: exportBooleanToEnterprise(configurationSettings, data.autoMarkIncomplete),
    АктивизироватьПоУмолчанию: exportBooleanToEnterprise(configurationSettings, data.defaultItem),
    ВажностьПриОтображении: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.displayImportance,
      SE.DisplayImportanceToEnterprise
    ),
    ВариантУправленияВысотой: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.heightControlVariant,
      SE.TableHeightControlVariantToEnterprise
    ),
    ВертикальнаяПолосаПрокрутки: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.verticalScrollBar,
      SE.ScrollBarUseToEnterprise
    ),
    ВертикальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.verticalAlignInGroup,
      SE.ItemVerticalAlignToEnterprise
    ),
    ВертикальныеЛинии: exportBooleanToEnterprise(configurationSettings, data.verticalLines),
    Видимость: exportBooleanToEnterprise(configurationSettings, data.visible),
    Вывод: exportSystemEnumerationToEnterprise(configurationSettings, data.output, SE.UseOutputToEnterprise),
    Высота: data.height,
    ВысотаВСтрокахТаблицы: data.heightInTableRows,
    ВысотаЗаголовка: data.titleHeight,
    ВысотаПодвала: data.footerHeight,
    ВысотаШапки: data.headerHeight,
    ГоризонтальнаяПолосаПрокрутки: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.horizontalScrollBar,
      SE.ScrollBarUseToEnterprise
    ),
    ГоризонтальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.horizontalAlignInGroup,
      SE.ItemHorizontalLocationToEnterprise
    ),
    ГоризонтальныеЛинии: exportBooleanToEnterprise(configurationSettings, data.horizontalLines),
    Доступность: exportBooleanToEnterprise(configurationSettings, data.enabled),
    Заголовок: exportI8nTextToEnterprise(configurationSettings, data.title),
    ЗапросОбновления: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.refreshRequest,
      SE.RefreshRequestMethodToEnterprise
    ),
    ИзменятьПорядокСтрок: exportBooleanToEnterprise(configurationSettings, data.changeRowOrder),
    ИзменятьСоставСтрок: exportBooleanToEnterprise(configurationSettings, data.changeRowSet),
    ИспользованиеТекущейСтроки: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.currentRowUse,
      SE.TableCurrentRowUseToEnterprise
    ),
    КартинкаСтрок: exportBooleanToEnterprise(configurationSettings, data.rowsPicture),
    Команда: exportCommandSetToEnterprise(configurationSettings, data.commandSet),
    КоманднаяПанель: exportCommandBarToEnterprise(configurationSettings, data.commandBar),
    КонтекстноеМеню: exportCommandBarToEnterprise(configurationSettings, data.contextMenu),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяВысотаВСтрокахТаблицы: data.maxHeightInTableRows,
    МаксимальнаяШирина: data.maxWidth,
    МножественныйВыбор: exportBooleanToEnterprise(configurationSettings, data.multipleChoice),
    НачальноеОтображениеДерева: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.initialTreeView,
      SE.InitialTreeViewToEnterprise
    ),
    НачальноеОтображениеСписка: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.initialListView,
      SE.InitialListViewToEnterprise
    ),
    ОтметкаНезаполненного: exportBooleanToEnterprise(configurationSettings, data.markIncomplete),
    Отображение: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.representation,
      SE.TableRepresentationToEnterprise
    ),
    ОтображениеПодсказки: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.toolTipRepresentation,
      SE.ToolTipRepresentationToEnterprise
    ),
    ОтображениеСостоянияПросмотра: exportFormItemAdditionToEnterprise(
      configurationSettings,
      data.viewStatusRepresentation
    ),
    ОтображениеСтрокиПоиска: exportFormItemAdditionToEnterprise(configurationSettings, data.searchStringRepresentation),
    ПоведениеПриСжатииПоГоризонтали: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.behaviorOnHorizontalCompression,
      SE.TableBehaviorOnHorizontalCompressionToEnterprise
    ),
    Подвал: exportBooleanToEnterprise(configurationSettings, data.footer),
    Подсказка: exportI8nTextToEnterprise(configurationSettings, data.toolTip),
    ПодчиненныеЭлементы: exportChildItemsToEnterprise(configurationSettings, data.childItems),
    ПоискПриВводе: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.searchOnInput,
      SE.SearchInTableOnInputToEnterprise
    ),
    ПоложениеЗаголовка: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.titleLocation,
      SE.FormItemTitleLocationToEnterprise
    ),
    ПоложениеКоманднойПанели: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.commandBarLocation,
      SE.FormItemCommandBarLabelLocationToEnterprise
    ),
    ПоложениеСостоянияПросмотра: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.viewStatusLocation,
      SE.ViewStatusLocationToEnterprise
    ),
    ПоложениеСтрокиПоиска: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.searchStringLocation,
      SE.SearchStringLocationToEnterprise
    ),
    ПоложениеУправленияПоиском: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.searchControlLocation,
      SE.SearchControlLocationToEnterprise
    ),
    ...exportUserVisibleToEnterprise(configurationSettings, data.userVisible),
    ПропускатьПриВводе: exportBooleanToEnterprise(configurationSettings, data.skipOnInput),
    ПутьКДанным: data.dataPath,
    ПутьКДаннымКартинкиСтроки: data.rowPictureDataPath,
    РазрешитьНачалоПеретаскивания: exportBooleanToEnterprise(configurationSettings, data.enableStartDrag),
    РазрешитьПеретаскивание: exportBooleanToEnterprise(configurationSettings, data.enableDrag),
    РастягиватьПоВертикали: exportBooleanToEnterprise(configurationSettings, data.verticalStretch),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(configurationSettings, data.horizontalStretch),
    РасширеннаяПодсказка: exportFormDecorationToEnterprise(configurationSettings, data.extendedTooltip),
    РежимВводаСтрок: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.rowInputMode,
      SE.TableRowInputModeToEnterprise
    ),
    РежимВыбора: exportBooleanToEnterprise(configurationSettings, data.choiceMode),
    РежимВыделения: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.selectionMode,
      SE.TableSelectionModeToEnterprise
    ),
    РежимВыделенияСтроки: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.rowSelectionMode,
      SE.TableRowSelectionModeToEnterprise
    ),
    СочетаниеКлавиш: data.shortcut,
    СпособПеретаскиванияФайлов: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.fileDragMode,
      SE.FileDragModeToEnterprise
    ),
    ТолькоПросмотр: exportBooleanToEnterprise(configurationSettings, data.readOnly),
    УправлениеПоиском: exportFormItemAdditionToEnterprise(configurationSettings, data.searchControl),
    ЦветРамки: exportColorToEnterprise(configurationSettings, data.borderColor),
    ЦветТекста: exportColorToEnterprise(configurationSettings, data.textColor),
    ЦветТекстаЗаголовка: exportColorToEnterprise(configurationSettings, data.titleTextColor),
    ЦветФона: exportColorToEnterprise(configurationSettings, data.backColor),
    ЧередованиеЦветовСтрок: exportBooleanToEnterprise(configurationSettings, data.useAlternationRowColor),
    Шапка: exportBooleanToEnterprise(configurationSettings, data.header),
    Ширина: data.width,
    Шрифт: exportFontToEnterprise(configurationSettings, data.font),
    ШрифтЗаголовка: exportFontToEnterprise(configurationSettings, data.titleFont),
    События: exportEventsToEnterprise(configurationSettings, data.events),
  })
}

registerMetadata("ExportToEnterprise", "Table", exportTableToEnterprise)
