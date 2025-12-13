import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { EventsXML } from "~/lib/metadata/forms/events/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "../formField/types"

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
  АвтоМаксимальнаяВысота?: boolean
  АвтоМаксимальнаяШирина?: boolean
  Высота?: number
  ГоризонтальныеЛинии?: boolean
  РастягиватьПоГоризонтали?: boolean
  РежимВыделенияИнтервалов?: SE.GanttChartIntervalsSelectionModeEnterprise
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  ПоложениеТаблицы?: SE.GanttChartTableLocationEnterprise
  ПользовательскаяВидимость?: UserVisibleEnterprise
  РежимВыделенияЗначений?: SE.GanttChartValuesSelectionModeEnterprise
  ВертикальныеЛинии?: boolean
  РастягиватьПоВертикали?: boolean
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
