import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorYAML } from "~/metadata/commonObjects/color/types"
import { Font, FontYAML } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { UserVisible, UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import { CommandSet, CommandSetYAML } from "~/metadata/forms/commonObjects/commandSet/types"
import { ContextMenu, ContextMenuYAML } from "~/metadata/forms/elements/contextMenu/types"

import { Picture, PictureYAML } from "~/metadata/commonObjects/picture/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { AutoCommandBar, AutoCommandBarYAML } from "../autoCommandBar/types"
import { ExtendedTooltip, ExtendedTooltipYAML } from "../extendedTooltip/types"
import { SingleSearchControlAddition, SingleSearchControlAdditionYAML } from "../searchControlAddition/types"
import { SearchStringAdditionYAML, SingleSearchStringAddition } from "../searchStringAddition/types"
import { ViewStatusAddition, ViewStatusAdditionYAML } from "../viewStatusAddition/types"
import { TableChildItems } from "../../commonObjects/childItems/types"

export interface Table {
  itemType: "Table"
  name: string
  autoAddIncomplete?: boolean
  autoCommandBar?: AutoCommandBar
  autoInsertNewRow?: boolean
  autoMarkIncomplete?: boolean
  autoMaxHeight?: boolean
  autoMaxHeightInTableRows?: boolean
  autoMaxWidth?: boolean
  backColor?: Color
  behaviorOnHorizontalCompression?: SE.TableBehaviorOnHorizontalCompression
  borderColor?: Color
  changeRowOrder?: boolean
  changeRowSet?: boolean
  childItems: TableChildItems
  choiceMode?: boolean
  commandBarLocation?: SE.FormItemCommandBarLabelLocation
  commandSet?: CommandSet
  contextMenu?: ContextMenu
  currentRowUse?: SE.TableCurrentRowUse
  dataPath?: string
  defaultItem?: boolean
  displayImportance?: SE.DisplayImportance
  enabled?: boolean
  enableDrag?: boolean
  enableStartDrag?: boolean
  extendedTooltip?: ExtendedTooltip
  fileDragMode?: SE.FileDragMode
  font?: Font
  footer?: boolean
  footerHeight?: number
  header?: boolean
  headerHeight?: number
  height?: number
  heightControlVariant?: SE.TableHeightControlVariant
  heightInTableRows?: number
  horizontalAlignInGroup?: SE.ItemHorizontalLocation
  horizontalLines?: boolean
  horizontalScrollBar?: SE.ScrollBarUse
  horizontalStretch?: boolean
  initialListView?: SE.InitialListView
  initialTreeView?: SE.InitialTreeView
  // markIncomplete?: boolean
  maxHeight?: number
  maxHeightInTableRows?: number
  maxWidth?: number
  multipleChoice?: boolean
  onMainServerUnavalableBehavior?: SE.OnMainServerUnavalableBehavior
  output?: SE.UseOutput
  readOnly?: boolean
  refreshRequest?: SE.RefreshRequestMethod
  representation?: SE.TableRepresentation
  rowInputMode?: SE.TableRowInputMode
  rowPictureDataPath?: string
  rowSelectionMode?: SE.TableRowSelectionMode
  rowsPicture?: Picture
  searchControl?: SingleSearchControlAddition
  searchControlLocation?: SE.SearchControlLocation
  searchOnInput?: SE.SearchInTableOnInput
  searchStringLocation?: SE.SearchStringLocation
  searchStringRepresentation?: SingleSearchStringAddition
  selectionMode?: SE.TableSelectionMode
  shortcut?: string
  skipOnInput?: boolean
  textColor?: Color
  title?: I8nText
  titleFont?: Font
  titleHeight?: number
  titleLocation?: SE.FormItemTitleLocation
  titleTextColor?: Color
  toolTip?: I8nText
  toolTipRepresentation?: SE.ToolTipRepresentation
  useAlternationRowColor?: boolean
  userVisible?: UserVisible
  verticalAlignInGroup?: SE.ItemVerticalAlign
  verticalLines?: boolean
  verticalScrollBar?: SE.ScrollBarUse
  verticalStretch?: boolean
  viewStatusLocation?: SE.ViewStatusLocation
  viewStatusRepresentation?: ViewStatusAddition
  visible?: boolean
  width?: number
  events?: {
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
    beforeLoadUserSettingsAtServer: string
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

  // Dynamic list
  autoRefresh?: boolean
  restoreCurrentRow?: boolean
  choiceFoldersAndItems?: SE.FoldersAndItemsUse
  // additionalCreateParameters?: boolean
  updateOnDataChange?: SE.UpdateOnDataChange
  showRoot?: boolean
  autoRefreshPeriod?: number
  allowRootChoice?: boolean
  allowGettingCurrentRowURL?: boolean
  userSettingsGroup?: string
  // period?: boolean // Игнорируем эти поля
  // topLevelParent?: boolean
}

export interface TablePartialYAML {
  АвтоВводНезаполненного?: StringboolYAML
  АвтоВводНовойСтроки?: StringboolYAML
  АвтоМаксимальнаяВысота?: StringboolYAML
  АвтоМаксимальнаяВысотаВСтрокахТаблицы?: StringboolYAML
  АвтоМаксимальнаяШирина?: StringboolYAML
  АвтоОтметкаНезаполненного?: StringboolYAML
  АктивизироватьПоУмолчанию?: StringboolYAML
  ВажностьПриОтображении?: SE.DisplayImportanceYAML
  ВариантУправленияВысотой?: SE.TableHeightControlVariantYAML
  ВертикальнаяПолосаПрокрутки?: SE.ScrollBarUseYAML
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignYAML
  ВертикальныеЛинии?: StringboolYAML
  Видимость?: StringboolYAML
  Вывод?: SE.UseOutputYAML
  Высота?: number
  ВысотаВСтрокахТаблицы?: number
  ВысотаЗаголовка?: number
  ВысотаПодвала?: number
  ВысотаШапки?: number
  ГоризонтальнаяПолосаПрокрутки?: SE.ScrollBarUseYAML
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationYAML
  ГоризонтальныеЛинии?: StringboolYAML
  Доступность?: StringboolYAML
  Заголовок?: I8nTextYAML
  ЗапросОбновления?: SE.RefreshRequestMethodYAML
  ИзменятьПорядокСтрок?: StringboolYAML
  ИзменятьСоставСтрок?: StringboolYAML
  ИспользованиеТекущейСтроки?: SE.TableCurrentRowUseYAML
  КартинкаСтрок?: PictureYAML
  Команда?: CommandSetYAML
  КоманднаяПанель?: AutoCommandBarYAML
  КонтекстноеМеню?: ContextMenuYAML
  МаксимальнаяВысота?: number
  МаксимальнаяВысотаВСтрокахТаблицы?: number
  МаксимальнаяШирина?: number
  МножественныйВыбор?: StringboolYAML
  НачальноеОтображениеДерева?: SE.InitialTreeViewYAML
  НачальноеОтображениеСписка?: SE.InitialListViewYAML
  ОтметкаНезаполненного?: StringboolYAML
  Отображение?: SE.TableRepresentationYAML
  ОтображениеПодсказки?: SE.ToolTipRepresentationYAML
  ОтображениеСостоянияПросмотра?: ViewStatusAdditionYAML
  ОтображениеСтрокиПоиска?: SearchStringAdditionYAML
  ПоведениеПриНедоступностиОсновногоСервера?: SE.OnMainServerUnavalableBehaviorYAML
  ПоведениеПриСжатииПоГоризонтали?: SE.TableBehaviorOnHorizontalCompressionYAML
  Подвал?: StringboolYAML
  Подсказка?: I8nTextYAML
  ПоискПриВводе?: SE.SearchInTableOnInputYAML
  ПоложениеЗаголовка?: SE.FormItemTitleLocationYAML
  ПоложениеКоманднойПанели?: SE.FormItemCommandBarLabelLocationYAML
  ПоложениеСостоянияПросмотра?: SE.ViewStatusLocationYAML
  ПоложениеСтрокиПоиска?: SE.SearchStringLocationYAML
  ПоложениеУправленияПоиском?: SE.SearchControlLocationYAML
  РазрешитьИспользование?: UserVisibleYAML
  ЗапретитьИспользование?: UserVisibleYAML
  ПропускатьПриВводе?: StringboolYAML
  ПутьКДанным?: string
  ПутьКДаннымКартинкиСтроки?: string
  РазрешитьНачалоПеретаскивания?: StringboolYAML
  РазрешитьПеретаскивание?: StringboolYAML
  РастягиватьПоВертикали?: StringboolYAML
  РастягиватьПоГоризонтали?: StringboolYAML
  РасширеннаяПодсказка?: ExtendedTooltipYAML
  РежимВводаСтрок?: SE.TableRowInputModeYAML
  РежимВыбора?: StringboolYAML
  РежимВыделения?: SE.TableSelectionModeYAML
  РежимВыделенияСтроки?: SE.TableRowSelectionModeYAML
  СочетаниеКлавиш?: string
  СпособПеретаскиванияФайлов?: SE.FileDragModeYAML
  ТолькоПросмотр?: StringboolYAML
  УправлениеПоиском?: SingleSearchControlAdditionYAML
  ЦветРамки?: ColorYAML
  ЦветТекста?: ColorYAML
  ЦветТекстаЗаголовка?: ColorYAML
  ЦветФона?: ColorYAML
  ЧередованиеЦветовСтрок?: StringboolYAML
  Шапка?: StringboolYAML
  Ширина?: number
  Шрифт?: FontYAML
  ШрифтЗаголовка?: FontYAML
  АвтоОбновление?: StringboolYAML
  ВосстанавливатьТекущуюСтроку?: StringboolYAML
  ВыборГруппИЭлементов?: SE.FoldersAndItemsUseYAML
  // ДополнительныеПараметрыСоздания?: StringboolYAML
  ОбновлениеПриИзмененииДанных?: SE.UpdateOnDataChangeYAML
  ОтображатьКорень?: StringboolYAML
  ПериодАвтоОбновления?: number
  РазрешитьВыборКорня?: StringboolYAML
  РазрешитьПолучатьНавигационнуюСсылкуТекущейСтроки?: StringboolYAML
  ГруппаПользовательскихНастроек?: string
  События?: {
    Выбор?: string
    ВыборЗначения?: string
    НачалоПеретаскивания?: string
    ОбработкаВыбора?: string
    ОбработкаЗаписиНового?: string
    ОбработкаЗапросаОбновления?: string
    ОкончаниеПеретаскивания?: string
    ПередЗагрузкойПользовательскихНастроекНаСервере: string
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
}
