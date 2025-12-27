import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "~/metadata/forms/elements/formField/types"
import { EventsXML } from "~/metadata/forms/events/types"
import * as SE from "~/metadata/systemEnumerations/types"

export interface GanttChartField extends FormField {
  autoMaxHeight?: boolean
  autoMaxWidth?: boolean
  height?: number
  horizontalLines?: boolean
  horizontalStretch?: boolean
  intervalsSelectionMode?: SE.GanttChartIntervalsSelectionMode
  maxHeight?: number
  maxWidth?: number
  tableLocation?: SE.GanttChartTableLocation
  userVisible?: UserVisible
  valuesSelectionMode?: SE.GanttChartValuesSelectionMode
  verticalLines?: boolean
  verticalStretch?: boolean
  width?: number
  events?: {
    onChange?: string
    selection?: string
    detailProcessing?: string
    beforeExpand?: string
    beforeCollapse?: string
    onActivateValue?: string
    onActivateInterval?: string
    onIntervalEditEnd?: string
  }
}

export interface GanttChartFieldXML extends FormFieldXML {
  AutoMaxHeight?: boolean
  AutoMaxWidth?: boolean
  Height?: number
  HorizontalLines?: boolean
  HorizontalStretch?: boolean
  IntervalsSelectionMode?: SE.GanttChartIntervalsSelectionMode
  MaxHeight?: number
  MaxWidth?: number
  TableLocation?: SE.GanttChartTableLocation
  UserVisible?: UserVisibleXML
  ValuesSelectionMode?: SE.GanttChartValuesSelectionMode
  VerticalLines?: boolean
  VerticalStretch?: boolean
  Width?: number
  Events?: EventsXML
}

export interface GanttChartFieldEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  ВертикальныеЛинии?: StringboolEnterprise
  Высота?: number
  ГоризонтальныеЛинии?: StringboolEnterprise
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  ПоложениеТаблицы?: SE.GanttChartTableLocationEnterprise
  ПользовательскаяВидимостьРазрешить?: UserVisibleEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  РежимВыделенияЗначений?: SE.GanttChartValuesSelectionModeEnterprise
  РежимВыделенияИнтервалов?: SE.GanttChartIntervalsSelectionModeEnterprise
  Ширина?: number
  События?: {
    ПриИзменении?: string
    Выбор?: string
    ОбработкаРасшифровки?: string
    ПередРазворачиванием?: string
    ПередСворачиванием?: string
    ПриАктивизацииЗначения?: string
    ПриАктивизацииИнтервала?: string
    ПриОкончанииРедактированияИнтервала?: string
  }
}
