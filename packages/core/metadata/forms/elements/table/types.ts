import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { CommandSet, CommandSetEnterprise, CommandSetXML } from "~/metadata/forms/commandSet/types"
import { BaseElementXML } from "~/metadata/forms/elements/baseElement/types"
import { ContextMenu, ContextMenuEnterprise, ContextMenuXML } from "~/metadata/forms/elements/contextMenu/types"

import { Picture, PictureEnterprise, PictureXML } from "~/metadata/commonObjects/picture/types"
import { EventsXML } from "~/metadata/forms/events/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { TableChildItems, TableChildItemsXML } from "../../collections/childItems/types"
import { AutoCommandBar, AutoCommandBarEnterprise, AutoCommandBarXML } from "../autoCommandBar/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise, ExtendedTooltipXML } from "../extendedTooltip/types"
import {
  SearchControlAdditionXML,
  SingleSearchControlAddition,
  SingleSearchControlAdditionEnterprise,
} from "../searchControlAddition/types"
import {
  SearchStringAdditionEnterprise,
  SearchStringAdditionXML,
  SingleSearchStringAddition,
} from "../searchStringAddition/types"
import { ViewStatusAddition, ViewStatusAdditionEnterprise, ViewStatusAdditionXML } from "../viewStatusAddition/types"

export interface Table {
  elementType: "Table"
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
  markIncomplete?: boolean
  maxHeight?: number
  maxHeightInTableRows?: number
  maxWidth?: number
  multipleChoice?: boolean
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
  searchStringAddition?: SingleSearchStringAddition
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
  viewStatusAddition?: ViewStatusAddition
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
  additionalCreateParameters?: boolean
  updateOnDataChange?: SE.UpdateOnDataChange
  showRoot?: boolean
  autoRefreshPeriod?: number
  allowRootChoice?: boolean
  allowGettingCurrentRowURL?: boolean
  userSettingsGroup?: string
  // period?: boolean // Игнорируем эти поля
  // topLevelParent?: boolean
}

export interface TableXML extends BaseElementXML {
  AutoAddIncomplete?: boolean
  AutoCommandBar: AutoCommandBarXML
  AutoInsertNewRow?: boolean
  AutoMarkIncomplete?: boolean
  AutoMaxHeight?: boolean
  AutoMaxHeightInTableRows?: boolean
  AutoMaxWidth?: boolean
  BackColor?: ColorXML
  BehaviorOnHorizontalCompression?: SE.TableBehaviorOnHorizontalCompression
  BorderColor?: ColorXML
  ChangeRowOrder?: boolean
  ChangeRowSet?: boolean
  ChildItems?: TableChildItemsXML
  ChoiceMode?: boolean
  CommandBarLocation?: SE.FormItemCommandBarLabelLocation
  CommandSet?: CommandSetXML
  ContextMenu: ContextMenuXML
  CurrentRowUse?: SE.TableCurrentRowUse
  DataPath?: string
  DefaultItem?: boolean
  _DisplayImportance?: SE.DisplayImportance
  Enabled?: boolean
  EnableDrag?: boolean
  EnableStartDrag?: boolean
  ExtendedTooltip: ExtendedTooltipXML
  FileDragMode?: SE.FileDragMode
  Font?: FontXML
  Footer?: boolean
  FooterHeight?: number
  Header?: boolean
  HeaderHeight?: number
  Height?: number
  HeightControlVariant?: SE.TableHeightControlVariant
  HeightInTableRows?: number
  HorizontalAlignInGroup?: SE.ItemHorizontalLocation
  HorizontalLines?: boolean
  HorizontalScrollBar?: SE.ScrollBarUse
  HorizontalStretch?: boolean
  InitialListView?: SE.InitialListView
  InitialTreeView?: SE.InitialTreeView
  MarkIncomplete?: boolean
  MaxHeight?: number
  MaxHeightInTableRows?: number
  MaxWidth?: number
  MultipleChoice?: boolean
  Output?: SE.UseOutput
  ReadOnly?: boolean
  RefreshRequest?: SE.RefreshRequestMethod
  Representation?: SE.TableRepresentation
  RowInputMode?: SE.TableRowInputMode
  RowPictureDataPath?: string
  RowSelectionMode?: SE.TableRowSelectionMode
  RowsPicture?: PictureXML
  SearchControlAddition: SearchControlAdditionXML
  SearchControlLocation?: SE.SearchControlLocation
  SearchOnInput?: SE.SearchInTableOnInput
  SearchStringLocation?: SE.SearchStringLocation
  SearchStringAddition: SearchStringAdditionXML
  SelectionMode?: SE.TableSelectionMode
  Shortcut?: string
  SkipOnInput?: boolean
  TextColor?: ColorXML
  Title?: I8nTextXML
  TitleFont?: FontXML
  TitleHeight?: number
  TitleLocation?: SE.FormItemTitleLocation
  TitleTextColor?: ColorXML
  ToolTip?: I8nTextXML
  ToolTipRepresentation?: SE.ToolTipRepresentation
  UseAlternationRowColor?: boolean
  UserVisible?: UserVisibleXML
  VerticalAlignInGroup?: SE.ItemVerticalAlign
  VerticalLines?: boolean
  VerticalScrollBar?: SE.ScrollBarUse
  VerticalStretch?: boolean
  ViewStatusLocation?: SE.ViewStatusLocation
  ViewStatusAddition: ViewStatusAdditionXML
  Visible?: boolean
  Width?: number
  Events?: EventsXML
  AutoRefresh?: boolean
  RestoreCurrentRow?: boolean
  ChoiceFoldersAndItems?: SE.FoldersAndItemsUse
  AdditionalCreateParameters?: boolean
  UpdateOnDataChange?: SE.UpdateOnDataChange
  ShowRoot?: boolean
  AutoRefreshPeriod?: number
  AllowRootChoice?: boolean
  AllowGettingCurrentRowURL?: boolean
  UserSettingsGroup?: string
}

export interface TablePartialEnterprise {
  АвтоВводНезаполненного?: StringboolEnterprise
  АвтоВводНовойСтроки?: StringboolEnterprise
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяВысотаВСтрокахТаблицы?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  АвтоОтметкаНезаполненного?: StringboolEnterprise
  АктивизироватьПоУмолчанию?: StringboolEnterprise
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  ВариантУправленияВысотой?: SE.TableHeightControlVariantEnterprise
  ВертикальнаяПолосаПрокрутки?: SE.ScrollBarUseEnterprise
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignEnterprise
  ВертикальныеЛинии?: StringboolEnterprise
  Видимость?: StringboolEnterprise
  Вывод?: SE.UseOutputEnterprise
  Высота?: number
  ВысотаВСтрокахТаблицы?: number
  ВысотаЗаголовка?: number
  ВысотаПодвала?: number
  ВысотаШапки?: number
  ГоризонтальнаяПолосаПрокрутки?: SE.ScrollBarUseEnterprise
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationEnterprise
  ГоризонтальныеЛинии?: StringboolEnterprise
  Доступность?: StringboolEnterprise
  Заголовок?: I8nTextEnterprise
  ЗапросОбновления?: SE.RefreshRequestMethodEnterprise
  ИзменятьПорядокСтрок?: StringboolEnterprise
  ИзменятьСоставСтрок?: StringboolEnterprise
  ИспользованиеТекущейСтроки?: SE.TableCurrentRowUseEnterprise
  КартинкаСтрок?: PictureEnterprise
  Команда?: CommandSetEnterprise
  КоманднаяПанель?: AutoCommandBarEnterprise
  КонтекстноеМеню?: ContextMenuEnterprise
  МаксимальнаяВысота?: number
  МаксимальнаяВысотаВСтрокахТаблицы?: number
  МаксимальнаяШирина?: number
  МножественныйВыбор?: StringboolEnterprise
  НачальноеОтображениеДерева?: SE.InitialTreeViewEnterprise
  НачальноеОтображениеСписка?: SE.InitialListViewEnterprise
  ОтметкаНезаполненного?: StringboolEnterprise
  Отображение?: SE.TableRepresentationEnterprise
  ОтображениеПодсказки?: SE.ToolTipRepresentationEnterprise
  ОтображениеСостоянияПросмотра?: ViewStatusAdditionEnterprise
  ОтображениеСтрокиПоиска?: SearchStringAdditionEnterprise
  ПоведениеПриСжатииПоГоризонтали?: SE.TableBehaviorOnHorizontalCompressionEnterprise
  Подвал?: StringboolEnterprise
  Подсказка?: I8nTextEnterprise
  ПоискПриВводе?: SE.SearchInTableOnInputEnterprise
  ПоложениеЗаголовка?: SE.FormItemTitleLocationEnterprise
  ПоложениеКоманднойПанели?: SE.FormItemCommandBarLabelLocationEnterprise
  ПоложениеСостоянияПросмотра?: SE.ViewStatusLocationEnterprise
  ПоложениеСтрокиПоиска?: SE.SearchStringLocationEnterprise
  ПоложениеУправленияПоиском?: SE.SearchControlLocationEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  ПропускатьПриВводе?: StringboolEnterprise
  ПутьКДанным?: string
  ПутьКДаннымКартинкиСтроки?: string
  РазрешитьНачалоПеретаскивания?: StringboolEnterprise
  РазрешитьПеретаскивание?: StringboolEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  РасширеннаяПодсказка?: ExtendedTooltipEnterprise
  РежимВводаСтрок?: SE.TableRowInputModeEnterprise
  РежимВыбора?: StringboolEnterprise
  РежимВыделения?: SE.TableSelectionModeEnterprise
  РежимВыделенияСтроки?: SE.TableRowSelectionModeEnterprise
  СочетаниеКлавиш?: string
  СпособПеретаскиванияФайлов?: SE.FileDragModeEnterprise
  ТолькоПросмотр?: StringboolEnterprise
  УправлениеПоиском?: SingleSearchControlAdditionEnterprise
  ЦветРамки?: ColorEnterprise
  ЦветТекста?: ColorEnterprise
  ЦветТекстаЗаголовка?: ColorEnterprise
  ЦветФона?: ColorEnterprise
  ЧередованиеЦветовСтрок?: StringboolEnterprise
  Шапка?: StringboolEnterprise
  Ширина?: number
  Шрифт?: FontEnterprise
  ШрифтЗаголовка?: FontEnterprise
  АвтоОбновление?: StringboolEnterprise
  ВосстанавливатьТекущуюСтроку?: StringboolEnterprise
  ВыборГруппИЭлементов?: SE.FoldersAndItemsUseEnterprise
  ДополнительныеПараметрыСоздания?: StringboolEnterprise
  ОбновлениеПриИзмененииДанных?: SE.UpdateOnDataChangeEnterprise
  ОтображатьКорень?: StringboolEnterprise
  ПериодАвтоОбновления?: number
  РазрешитьВыборКорня?: StringboolEnterprise
  РазрешитьПолучатьНавигационнуюСсылкуТекущейСтроки?: StringboolEnterprise
  ГруппаПользовательскихНастроек?: string
  События?: {
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
}
