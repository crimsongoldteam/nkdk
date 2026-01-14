import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Border, BorderEnterprise, BorderXML } from "~/metadata/commonObjects/border/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/metadata/commonObjects/font/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "~/metadata/forms/elements/formField/types"
import { EventsXML } from "~/metadata/forms/events/types"
import * as SE from "~/metadata/systemEnumerations/types"

export interface CalendarField extends FormField {
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
  userVisible?: UserVisible
  verticalStretch?: boolean
  width?: number
  widthInMonths?: number
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
  UserVisible?: UserVisibleXML
  VerticalStretch?: boolean
  Width?: number
  WidthInMonths?: number
  Events?: EventsXML
}

export interface CalendarFieldPartialEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  Высота?: number
  ВысотаВМесяцах?: number
  КонецПериодаОтображения?: string
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  НачалоПериодаОтображения?: string
  ОтображатьПанельМесяцев?: StringboolEnterprise
  ОтображатьТекущуюДату?: StringboolEnterprise
  ПеремещениеПоКалендарю?: StringboolEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  РазрешитьНачалоПеретаскивания?: StringboolEnterprise
  РазрешитьПеретаскивание?: StringboolEnterprise
  Рамка?: BorderEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  РежимВыделения?: SE.DateSelectionModeEnterprise
  ЦветРамки?: ColorEnterprise
  Ширина?: number
  ШиринаВМесяцах?: number
  Шрифт?: FontEnterprise
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
