import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Border, BorderEnterprise } from "~/metadata/commonObjects/border/types"
import { Color, ColorEnterprise } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise } from "~/metadata/commonObjects/i8nText/types"
import { UserVisible, UserVisibleEnterprise } from "~/metadata/commonObjects/userVisible/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { NamedElement } from "../baseElement/types"
import { ContextMenu, ContextMenuEnterprise } from "../contextMenu/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise } from "../extendedTooltip/types"

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
