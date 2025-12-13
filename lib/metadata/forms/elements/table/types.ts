import { Color, ColorEnterprise, ColorXML } from "~/lib/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/lib/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { CommandSet, CommandSetEnterprise, CommandSetXML } from "~/lib/metadata/forms/commandSet/types"
import {
  SearchControlAddition,
  SearchControlAdditionEnterprise,
  SearchControlAdditionXML,
} from "~/lib/metadata/forms/elements/searchControlAddition/types"
import {
  SearchStringAddition,
  SearchStringAdditionEnterprise,
  SearchStringAdditionXML,
} from "~/lib/metadata/forms/elements/searchStringAddition/types"
import {
  ViewStatusAddition,
  ViewStatusAdditionEnterprise,
  ViewStatusAdditionXML,
} from "~/lib/metadata/forms/elements/viewStatusAddition/types"
import { EventsXML } from "~/lib/metadata/forms/events/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { BaseElement, BaseElementEnterprise, BaseElementXML } from "../baseElement/types"
import { ChildItems, ChildItemsXML } from "../childItems/types"
import { CommandBar, CommandBarEnterprise, CommandBarXML } from "../commandBar/types"
import { FormDecoration, FormDecorationEnterprise, FormDecorationXML } from "../formDecoration/types"
import { FormItemAddition, FormItemAdditionEnterprise, FormItemAdditionXML } from "../formItemAddition/types"

export interface Table extends BaseElement {
  autoAddIncomplete?: boolean
  autoCommandBar?: CommandBar
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
  choiceMode?: boolean
  commandBar?: CommandBar
  commandBarLocation?: SE.FormItemCommandBarLabelLocation
  commandSet?: CommandSet
  contextMenu?: CommandBar
  currentRowUse?: SE.TableCurrentRowUse
  dataPath?: string
  defaultItem?: boolean
  displayImportance?: SE.DisplayImportance
  enabled?: boolean
  enableDrag?: boolean
  enableStartDrag?: boolean
  extendedTooltip?: FormDecoration
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
  rowsPicture?: boolean
  searchControl?: FormItemAddition
  searchControlAddition?: SearchControlAddition
  searchControlLocation?: SE.SearchControlLocation
  searchOnInput?: SE.SearchInTableOnInput
  searchStringAddition?: SearchStringAddition
  searchStringLocation?: SE.SearchStringLocation
  searchStringRepresentation?: FormItemAddition
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
  viewStatusAddition?: ViewStatusAddition
  viewStatusLocation?: SE.ViewStatusLocation
  viewStatusRepresentation?: FormItemAddition
  visible?: boolean
  width?: number
  childItems?: ChildItems
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
}

export interface TableXML extends BaseElementXML {
  AutoAddIncomplete?: boolean
  AutoCommandBar?: CommandBarXML
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
  ChoiceMode?: boolean
  CommandBar?: CommandBarXML
  CommandBarLocation?: SE.FormItemCommandBarLabelLocation
  CommandSet?: CommandSetXML
  ContextMenu?: CommandBarXML
  CurrentRowUse?: SE.TableCurrentRowUse
  DataPath?: string
  DefaultItem?: boolean
  _DisplayImportance?: SE.DisplayImportance
  Enabled?: boolean
  EnableDrag?: boolean
  EnableStartDrag?: boolean
  ExtendedTooltip?: FormDecorationXML
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
  RowsPicture?: boolean
  SearchControl?: FormItemAdditionXML
  SearchControlAddition?: SearchControlAdditionXML
  SearchControlLocation?: SE.SearchControlLocation
  SearchOnInput?: SE.SearchInTableOnInput
  SearchStringAddition?: SearchStringAdditionXML
  SearchStringLocation?: SE.SearchStringLocation
  SearchStringRepresentation?: FormItemAdditionXML
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
  ViewStatusAddition?: ViewStatusAdditionXML
  ViewStatusLocation?: SE.ViewStatusLocation
  ViewStatusRepresentation?: FormItemAdditionXML
  Visible?: boolean
  Width?: number
  ChildItems?: ChildItemsXML
  Events?: EventsXML
}

export interface TableEnterprise extends BaseElementEnterprise {
  АвтоВводНезаполненного?: boolean
  АвтоКоманднаяПанель?: CommandBarEnterprise
  АвтоВводНовойСтроки?: boolean
  АвтоОтметкаНезаполненного?: boolean
  АвтоМаксимальнаяВысота?: boolean
  АвтоМаксимальнаяВысотаВСтрокахТаблицы?: boolean
  АвтоМаксимальнаяШирина?: boolean
  ЦветФона?: ColorEnterprise
  ПоведениеПриСжатииПоГоризонтали?: SE.TableBehaviorOnHorizontalCompressionEnterprise
  ЦветРамки?: ColorEnterprise
  ИзменятьПорядокСтрок?: boolean
  ИзменятьСоставСтрок?: boolean
  РежимВыбора?: boolean
  КоманднаяПанель?: CommandBarEnterprise
  ПоложениеКоманднойПанели?: SE.FormItemCommandBarLabelLocationEnterprise
  Команда?: CommandSetEnterprise
  КонтекстноеМеню?: CommandBarEnterprise
  ИспользованиеТекущейСтроки?: SE.TableCurrentRowUseEnterprise
  ПутьКДанным?: string
  АктивизироватьПоУмолчанию?: boolean
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  Доступность?: boolean
  РазрешитьПеретаскивание?: boolean
  РазрешитьНачалоПеретаскивания?: boolean
  РасширеннаяПодсказка?: FormDecorationEnterprise
  СпособПеретаскиванияФайлов?: SE.FileDragModeEnterprise
  Шрифт?: FontEnterprise
  Подвал?: boolean
  ВысотаПодвала?: number
  Шапка?: boolean
  ВысотаШапки?: number
  Высота?: number
  ВариантУправленияВысотой?: SE.TableHeightControlVariantEnterprise
  ВысотаВСтрокахТаблицы?: number
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationEnterprise
  ГоризонтальныеЛинии?: boolean
  ГоризонтальнаяПолосаПрокрутки?: SE.ScrollBarUseEnterprise
  РастягиватьПоГоризонтали?: boolean
  НачальноеОтображениеСписка?: SE.InitialListViewEnterprise
  НачальноеОтображениеДерева?: SE.InitialTreeViewEnterprise
  ОтметкаНезаполненного?: boolean
  МаксимальнаяВысота?: number
  МаксимальнаяВысотаВСтрокахТаблицы?: number
  МаксимальнаяШирина?: number
  МножественныйВыбор?: boolean
  Вывод?: SE.UseOutputEnterprise
  ТолькоПросмотр?: boolean
  ЗапросОбновления?: SE.RefreshRequestMethodEnterprise
  Отображение?: SE.TableRepresentationEnterprise
  РежимВводаСтрок?: SE.TableRowInputModeEnterprise
  ПутьКДаннымКартинкиСтроки?: string
  РежимВыделенияСтроки?: SE.TableRowSelectionModeEnterprise
  КартинкаСтрок?: boolean
  УправлениеПоиском?: FormItemAdditionEnterprise
  УправлениеПоиском?: SearchControlAdditionEnterprise
  ПоложениеУправленияПоиском?: SE.SearchControlLocationEnterprise
  ПоискПриВводе?: SE.SearchInTableOnInputEnterprise
  ПоложениеПоисковогоСтроки?: SearchStringAdditionEnterprise
  ПоложениеСтрокиПоиска?: SE.SearchStringLocationEnterprise
  ОтображениеСтрокиПоиска?: FormItemAdditionEnterprise
  РежимВыделения?: SE.TableSelectionModeEnterprise
  СочетаниеКлавиш?: string
  ПропускатьПриВводе?: boolean
  ЦветТекста?: ColorEnterprise
  Заголовок?: I8nTextEnterprise
  ШрифтЗаголовка?: FontEnterprise
  ВысотаЗаголовка?: number
  ПоложениеЗаголовка?: SE.FormItemTitleLocationEnterprise
  ЦветТекстаЗаголовка?: ColorEnterprise
  Подсказка?: I8nTextEnterprise
  ОтображениеПодсказки?: SE.ToolTipRepresentationEnterprise
  ЧередованиеЦветовСтрок?: boolean
  ПользовательскаяВидимость?: UserVisibleEnterprise
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignEnterprise
  ВертикальныеЛинии?: boolean
  ВертикальнаяПолосаПрокрутки?: SE.ScrollBarUseEnterprise
  РастягиватьПоВертикали?: boolean
  ПоложениеСостоянияПросмотра?: ViewStatusAdditionEnterprise
  ПоложениеСостоянияПросмотра?: SE.ViewStatusLocationEnterprise
  ОтображениеСостоянияПросмотра?: FormItemAdditionEnterprise
  Видимость?: boolean
  Ширина?: number
  ПодчиненныеЭлементы?: ChildItemsEnterprise
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
