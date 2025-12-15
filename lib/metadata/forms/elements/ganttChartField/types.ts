import { StringboolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
import {
  UserVisible,
  UserVisibleAllowEnterprise,
  UserVisibleDenyEnterprise,
  UserVisibleXML,
} from "~/lib/metadata/commonObjects/userVisible/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "~/lib/metadata/forms/elements/formField/types"
import { EventsXML } from "~/lib/metadata/forms/events/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

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
  valuesSelectionMode?: SE.GanttChartValuesSelectionMode
  verticalLines?: boolean
  verticalStretch?: boolean
  width?: number
  userVisible?: UserVisible
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
  ValuesSelectionMode?: SE.GanttChartValuesSelectionMode
  VerticalLines?: boolean
  VerticalStretch?: boolean
  Width?: number
  UserVisible?: UserVisibleXML
  Events?: EventsXML
}

export interface GanttChartFieldEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  Высота?: number
  ГоризонтальныеЛинии?: StringboolEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  РежимВыделенияИнтервалов?: SE.GanttChartIntervalsSelectionModeEnterprise
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  ПоложениеТаблицы?: SE.GanttChartTableLocationEnterprise
  РежимВыделенияЗначений?: SE.GanttChartValuesSelectionModeEnterprise
  ВертикальныеЛинии?: StringboolEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  Ширина?: number
  ПользовательскаяВидимостьРазрешить?: UserVisibleAllowEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleDenyEnterprise
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
