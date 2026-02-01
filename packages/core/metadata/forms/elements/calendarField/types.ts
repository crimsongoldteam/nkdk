import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Border, BorderEnterprise, BorderXML } from "~/metadata/commonObjects/border/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { MetadataValueXML } from "~/metadata/commonObjects/metadataValue/types"
import { TypeDescriptionXML } from "~/metadata/commonObjects/typeDescription/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { EventsXML } from "~/metadata/forms/events/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { BaseElementXML, NamedElement } from "../baseElement/types"
import { ContextMenu, ContextMenuEnterprise, ContextMenuXML } from "../contextMenu/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise, ExtendedTooltipXML } from "../extendedTooltip/types"

export interface CalendarField extends NamedElement {
  elementType: "CalendarField"
  autoMaxHeight?: boolean
  autoMaxWidth?: boolean
  beginOfRepresentationPeriod?: string
  border?: Border
  borderColor?: Color
  calendarNavigation?: boolean
  enableDrag?: boolean
  enableStartDrag?: boolean
  endOfRepresentationPeriod?: string
  font?: Font
  height?: number
  heightInMonths?: number
  horizontalStretch?: boolean
  maxHeight?: number
  maxWidth?: number
  selectionMode?: SE.DateSelectionMode
  showCurrentDate?: boolean
  showMonthsPanel?: boolean
  verticalStretch?: boolean
  width?: number
  widthInMonths?: number
  autoCellHeight?: boolean
  cellHyperlink?: boolean
  contextMenu?: ContextMenu
  dataPath?: string
  defaultItem?: boolean
  displayImportance?: SE.DisplayImportance
  enabled?: boolean
  extendedTooltip?: ExtendedTooltip
  horizontalAlignInGroup?: SE.ItemHorizontalLocation
  readOnly?: boolean
  shortcut?: string
  skipOnInput?: boolean
  title?: I8nText
  titleFont?: Font
  titleHeight?: number
  titleLocation?: SE.FormItemTitleLocation
  titleTextColor?: Color
  toolTip?: I8nText
  toolTipRepresentation?: SE.ToolTipRepresentation
  userVisible?: UserVisible
  verticalAlignInGroup?: SE.ItemVerticalAlign
  visible?: boolean
  warningOnEdit?: I8nText
  warningOnEditRepresentation?: SE.WarningOnEditRepresentation
  onMainServerUnavalableBehavior?: SE.OnMainServerUnavalableBehavior
  events?: {
    onChange?: string
    selection?: string
    dragStart?: string
    dragEnd?: string
    drag?: string
    onActivateDate?: string
    onPeriodOutput?: string
    dragCheck?: string
  }
}

export interface CalendarFieldXML extends BaseElementXML {
  AutoMaxHeight?: boolean
  AutoMaxWidth?: boolean
  BeginOfRepresentationPeriod?: string
  Border?: BorderXML
  BorderColor?: ColorXML
  CalendarNavigation?: boolean
  EnableDrag?: boolean
  EnableStartDrag?: boolean
  EndOfRepresentationPeriod?: string
  Font?: FontXML
  Height?: number
  HeightInMonths?: number
  HorizontalStretch?: boolean
  MaxHeight?: number
  MaxWidth?: number
  SelectionMode?: SE.DateSelectionMode
  ShowCurrentDate?: boolean
  ShowMonthsPanel?: boolean
  VerticalStretch?: boolean
  Width?: number
  WidthInMonths?: number
  AutoCellHeight?: boolean
  CellHyperlink?: boolean
  ContextMenu: ContextMenuXML
  DataPath?: string
  DefaultItem?: boolean
  _DisplayImportance?: SE.DisplayImportance
  EditMode?: SE.ColumnEditMode
  Enabled?: boolean
  ExtendedTooltip: ExtendedTooltipXML
  GroupHorizontalAlign?: SE.ItemHorizontalLocation
  ReadOnly?: boolean
  Shortcut?: string
  ShowInFooter?: boolean
  ShowInHeader?: boolean
  SkipOnInput?: boolean
  AssociatedTableElementId?: MetadataValueXML
  Title?: I8nTextXML
  TitleBackColor?: ColorXML
  TitleFont?: FontXML
  TitleHeight?: number
  TitleLocation?: SE.FormItemTitleLocation
  TitleTextColor?: ColorXML
  ToolTip?: I8nTextXML
  ToolTipRepresentation?: SE.ToolTipRepresentation
  Type?: SE.FormFieldType
  TypeRestriction?: TypeDescriptionXML
  UserVisible?: UserVisibleXML
  GroupVerticalAlign?: SE.ItemVerticalAlign
  Visible?: boolean
  WarningOnEdit?: I8nTextXML
  WarningOnEditRepresentation?: SE.WarningOnEditRepresentation
  OnMainServerUnavalableBehavior?: SE.OnMainServerUnavalableBehavior
  Events?: EventsXML
}

export interface CalendarFieldPartialEnterprise {
  АвтоВысотаЯчейки?: StringboolEnterprise
  АктивизироватьПоУмолчанию?: StringboolEnterprise
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  ВертикальноеПоложение?: SE.ItemVerticalAlignEnterprise
  Видимость?: StringboolEnterprise
  Высота?: number
  ВысотаВМесяцах?: number
  ВысотаЗаголовка?: number
  ГиперссылкаЯчейки?: StringboolEnterprise
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationEnterprise
  Доступность?: StringboolEnterprise
  Заголовок?: I8nTextEnterprise
  КонецПериодаОтображения?: string
  КонтекстноеМеню?: ContextMenuEnterprise
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  НачалоПериодаОтображения?: string
  ОтображатьПанельМесяцев?: StringboolEnterprise
  ОтображатьТекущуюДату?: StringboolEnterprise
  ОтображениеПодсказки?: SE.ToolTipRepresentationEnterprise
  ОтображениеПредупрежденияПриРедактировании?: SE.WarningOnEditRepresentationEnterprise
  ПеремещениеПоКалендарю?: StringboolEnterprise
  Подсказка?: I8nTextEnterprise
  ПоложениеЗаголовка?: SE.FormItemTitleLocationEnterprise
  ПредупреждениеПриРедактировании?: I8nTextEnterprise
  ПропускатьПриВводе?: StringboolEnterprise
  ПутьКДанным?: string
  РасширеннаяПодсказка?: ExtendedTooltipEnterprise
  РазрешитьНачалоПеретаскивания?: StringboolEnterprise
  РазрешитьПеретаскивание?: StringboolEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  Рамка?: BorderEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  РежимВыделения?: SE.DateSelectionModeEnterprise
  СочетаниеКлавиш?: string
  ТолькоПросмотр?: StringboolEnterprise
  ЦветРамки?: ColorEnterprise
  ЦветТекстаЗаголовка?: ColorEnterprise
  Ширина?: number
  ШиринаВМесяцах?: number
  Шрифт?: FontEnterprise
  ШрифтЗаголовка?: FontEnterprise
  ПоведениеПриНедоступностиОсновногоСервера?: SE.OnMainServerUnavalableBehaviorEnterprise
  События?: {
    ПриИзменении?: string
    Выбор?: string
    НачалоПеретаскивания?: string
    ОкончаниеПеретаскивания?: string
    Перетаскивание?: string
    ПриАктивизацииДаты?: string
    ПриВыводеПериода?: string
    ПроверкаПеретаскивания?: string
  }
}

export interface CalendarFieldTypedEnterprise extends CalendarFieldPartialEnterprise {
  Тип: "ПолеКалендаря"
}

// Для обратной совместимости
export type CalendarFieldEnterprise = CalendarFieldPartialEnterprise
