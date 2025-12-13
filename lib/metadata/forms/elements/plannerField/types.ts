import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { EventsXML } from "~/lib/metadata/forms/events/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "../formField/types"

export interface PlannerField extends FormField {
  autoMaxHeight?: boolean
  autoMaxWidth?: boolean
  dimensionItemHyperlink?: boolean
  enableDrag?: boolean
  enableStartDrag?: boolean
  height?: number
  horizontalStretch?: boolean
  maxHeight?: number
  maxWidth?: number
  timeScaleItemHyperlink?: boolean
  userVisible?: UserVisible
  verticalStretch?: boolean
  width?: number
  wrappedTimeScaleHeaderHyperlink?: boolean
  events?: {
    onChange?: string
    selection?: string
    plannerActionClick?: string
    uRLClick?: string
    wrappedTimeScaleHeaderClick?: string
    dimensionItemClick?: string
    timeScaleItemClick?: string
    dragStart?: string
    commandGenerateProcessing?: string
    dragEnd?: string
    beforeStartQuickEdit?: string
    beforeStartEdit?: string
    beforePrint?: string
    beforeExpandDimensionItem?: string
    beforeCollapseDimensionItem?: string
    beforeCreate?: string
    beforeDelete?: string
    drag?: string
    onActivate?: string
    onEditEnd?: string
    onCurrentRepresentationPeriodChange?: string
    dragCheck?: string
    insideDragCheck?: string
  }
}

export interface PlannerFieldXML extends FormFieldXML {
  AutoMaxHeight?: boolean
  AutoMaxWidth?: boolean
  DimensionItemHyperlink?: boolean
  EnableDrag?: boolean
  EnableStartDrag?: boolean
  Height?: number
  HorizontalStretch?: boolean
  MaxHeight?: number
  MaxWidth?: number
  TimeScaleItemHyperlink?: boolean
  UserVisible?: UserVisibleXML
  VerticalStretch?: boolean
  Width?: number
  WrappedTimeScaleHeaderHyperlink?: boolean
  Events?: EventsXML
}

export interface PlannerFieldEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: boolean
  АвтоМаксимальнаяШирина?: boolean
  ГиперссылкаЭлементаИзмерения?: boolean
  РазрешитьПеретаскивание?: boolean
  РазрешитьНачалоПеретаскивания?: boolean
  Высота?: number
  РастягиватьПоГоризонтали?: boolean
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  ГиперссылкаЭлементаШкалыВремени?: boolean
  ПользовательскаяВидимость?: UserVisibleEnterprise
  РастягиватьПоВертикали?: boolean
  Ширина?: number
  ГиперссылкаПеренесенногоЗаголовкаШкалыВремени?: boolean
  События?: {
    ПриИзменении?: string
    Выбор?: string
    НажатиеНаДействиеПланировщика?: string
    НажатиеНаНавигационнойСсылке?: string
    НажатиеНаПеренесенномЗаголовкеШкалыВремени?: string
    НажатиеНаЭлементеИзмерения?: string
    НажатиеНаЭлементеШкалыВремени?: string
    НачалоПеретаскивания?: string
    ОбработкаФормированияКоманд?: string
    ОкончаниеПеретаскивания?: string
    ПередНачаломБыстрогоРедактирования?: string
    ПередНачаломРедактирования?: string
    ПередПечатью?: string
    ПередРазворачиваниемЭлементаИзмерения?: string
    ПередСворачиваниемЭлементаИзмерения?: string
    ПередСозданием?: string
    ПередУдалением?: string
    Перетаскивание?: string
    ПриАктивизации?: string
    ПриОкончанииРедактирования?: string
    ПриСменеТекущегоПериодаОтображения?: string
    ПроверкаПеретаскивания?: string
    ПроверкаПеретаскиванияВнутри?: string
  }
}
