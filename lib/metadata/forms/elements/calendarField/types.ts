import { StringboolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
import { Border, BorderEnterprise, BorderXML } from "~/lib/metadata/commonObjects/border/types"
import { Color, ColorEnterprise, ColorXML } from "~/lib/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/lib/metadata/commonObjects/font/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "~/lib/metadata/forms/elements/formField/types"
import { EventsXML } from "~/lib/metadata/forms/events/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export interface CalendarField extends FormField {
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
  userVisible?: UserVisible
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

export interface CalendarFieldXML extends FormFieldXML {
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
  UserVisible?: UserVisibleXML
  Events?: EventsXML
}

export interface CalendarFieldEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  НачалоПериодаОтображения?: string
  Рамка?: BorderEnterprise
  ЦветРамки?: ColorEnterprise
  ПеремещениеПоКалендарю?: StringboolEnterprise
  РазрешитьПеретаскивание?: StringboolEnterprise
  РазрешитьНачалоПеретаскивания?: StringboolEnterprise
  КонецПериодаОтображения?: string
  Шрифт?: FontEnterprise
  Высота?: number
  ВысотаВМесяцах?: number
  РастягиватьПоГоризонтали?: StringboolEnterprise
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  РежимВыделения?: SE.DateSelectionModeEnterprise
  ОтображатьТекущуюДату?: StringboolEnterprise
  ОтображатьПанельМесяцев?: StringboolEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  Ширина?: number
  ШиринаВМесяцах?: number
  ПользовательскаяВидимостьРазрешить?: UserVisibleEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleEnterprise
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
