import { StringboolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/lib/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/lib/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import {
  UserVisible,
  UserVisibleAllowEnterprise,
  UserVisibleDenyEnterprise,
  UserVisibleXML,
} from "~/lib/metadata/commonObjects/userVisible/types"
import { CommandSet, CommandSetEnterprise, CommandSetXML } from "~/lib/metadata/forms/commandSet/types"
import { BaseElement, BaseElementEnterprise, BaseElementXML } from "~/lib/metadata/forms/elements/baseElement/types"
import { ChildItems, ChildItemsEnterprise, ChildItemsXML } from "~/lib/metadata/forms/elements/childItems/types"
import { CommandBar, CommandBarEnterprise, CommandBarXML } from "~/lib/metadata/forms/elements/commandBar/types"
import {
  FormDecoration,
  FormDecorationEnterprise,
  FormDecorationXML,
} from "~/lib/metadata/forms/elements/formDecoration/types"
import {
  FormItemAddition,
  FormItemAdditionEnterprise,
  FormItemAdditionXML,
} from "~/lib/metadata/forms/elements/formItemAddition/types"
import { EventsXML } from "~/lib/metadata/forms/events/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

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
  searchControlLocation?: SE.SearchControlLocation
  searchOnInput?: SE.SearchInTableOnInput
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
  verticalAlignInGroup?: SE.ItemVerticalAlign
  verticalLines?: boolean
  verticalScrollBar?: SE.ScrollBarUse
  verticalStretch?: boolean
  viewStatusLocation?: SE.ViewStatusLocation
  viewStatusRepresentation?: FormItemAddition
  visible?: boolean
  width?: number
  childItems?: ChildItems
  userVisible?: UserVisible
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
  SearchControlLocation?: SE.SearchControlLocation
  SearchOnInput?: SE.SearchInTableOnInput
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
  VerticalAlignInGroup?: SE.ItemVerticalAlign
  VerticalLines?: boolean
  VerticalScrollBar?: SE.ScrollBarUse
  VerticalStretch?: boolean
  ViewStatusLocation?: SE.ViewStatusLocation
  ViewStatusRepresentation?: FormItemAdditionXML
  Visible?: boolean
  Width?: number
  ChildItems?: ChildItemsXML
  UserVisible?: UserVisibleXML
  Events?: EventsXML
}

export interface TableEnterprise extends BaseElementEnterprise {
  АвтоВводНезаполненного?: StringboolEnterprise
  АвтоКоманднаяПанель?: CommandBarEnterprise
  АвтоВводНовойСтроки?: StringboolEnterprise
  АвтоОтметкаНезаполненного?: StringboolEnterprise
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяВысотаВСтрокахТаблицы?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  ЦветФона?: ColorEnterprise
  ПоведениеПриСжатииПоГоризонтали?: SE.TableBehaviorOnHorizontalCompressionEnterprise
  ЦветРамки?: ColorEnterprise
  ИзменятьПорядокСтрок?: StringboolEnterprise
  ИзменятьСоставСтрок?: StringboolEnterprise
  РежимВыбора?: StringboolEnterprise
  КоманднаяПанель?: CommandBarEnterprise
  ПоложениеКоманднойПанели?: SE.FormItemCommandBarLabelLocationEnterprise
  Команда?: CommandSetEnterprise
  КонтекстноеМеню?: CommandBarEnterprise
  ИспользованиеТекущейСтроки?: SE.TableCurrentRowUseEnterprise
  ПутьКДанным?: string
  АктивизироватьПоУмолчанию?: StringboolEnterprise
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  Доступность?: StringboolEnterprise
  РазрешитьПеретаскивание?: StringboolEnterprise
  РазрешитьНачалоПеретаскивания?: StringboolEnterprise
  РасширеннаяПодсказка?: FormDecorationEnterprise
  СпособПеретаскиванияФайлов?: SE.FileDragModeEnterprise
  Шрифт?: FontEnterprise
  Подвал?: StringboolEnterprise
  ВысотаПодвала?: number
  Шапка?: StringboolEnterprise
  ВысотаШапки?: number
  Высота?: number
  ВариантУправленияВысотой?: SE.TableHeightControlVariantEnterprise
  ВысотаВСтрокахТаблицы?: number
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationEnterprise
  ГоризонтальныеЛинии?: StringboolEnterprise
  ГоризонтальнаяПолосаПрокрутки?: SE.ScrollBarUseEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  НачальноеОтображениеСписка?: SE.InitialListViewEnterprise
  НачальноеОтображениеДерева?: SE.InitialTreeViewEnterprise
  ОтметкаНезаполненного?: StringboolEnterprise
  МаксимальнаяВысота?: number
  МаксимальнаяВысотаВСтрокахТаблицы?: number
  МаксимальнаяШирина?: number
  МножественныйВыбор?: StringboolEnterprise
  Вывод?: SE.UseOutputEnterprise
  ТолькоПросмотр?: StringboolEnterprise
  ЗапросОбновления?: SE.RefreshRequestMethodEnterprise
  Отображение?: SE.TableRepresentationEnterprise
  РежимВводаСтрок?: SE.TableRowInputModeEnterprise
  ПутьКДаннымКартинкиСтроки?: string
  РежимВыделенияСтроки?: SE.TableRowSelectionModeEnterprise
  КартинкаСтрок?: StringboolEnterprise
  УправлениеПоиском?: FormItemAdditionEnterprise
  ПоложениеУправленияПоиском?: SE.SearchControlLocationEnterprise
  ПоискПриВводе?: SE.SearchInTableOnInputEnterprise
  ПоложениеСтрокиПоиска?: SE.SearchStringLocationEnterprise
  ОтображениеСтрокиПоиска?: FormItemAdditionEnterprise
  РежимВыделения?: SE.TableSelectionModeEnterprise
  СочетаниеКлавиш?: string
  ПропускатьПриВводе?: StringboolEnterprise
  ЦветТекста?: ColorEnterprise
  Заголовок?: I8nTextEnterprise
  ШрифтЗаголовка?: FontEnterprise
  ВысотаЗаголовка?: number
  ПоложениеЗаголовка?: SE.FormItemTitleLocationEnterprise
  ЦветТекстаЗаголовка?: ColorEnterprise
  Подсказка?: I8nTextEnterprise
  ОтображениеПодсказки?: SE.ToolTipRepresentationEnterprise
  ЧередованиеЦветовСтрок?: StringboolEnterprise
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignEnterprise
  ВертикальныеЛинии?: StringboolEnterprise
  ВертикальнаяПолосаПрокрутки?: SE.ScrollBarUseEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  ПоложениеСостоянияПросмотра?: SE.ViewStatusLocationEnterprise
  ОтображениеСостоянияПросмотра?: FormItemAdditionEnterprise
  Видимость?: StringboolEnterprise
  Ширина?: number
  ПодчиненныеЭлементы?: ChildItemsEnterprise
  ПользовательскаяВидимостьРазрешить?: UserVisibleAllowEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleDenyEnterprise
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
