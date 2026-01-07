import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "~/metadata/forms/elements/formField/types"
import { EventsXML } from "~/metadata/forms/events/types"

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
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  Высота?: number
  ГиперссылкаПеренесенногоЗаголовкаШкалыВремени?: StringboolEnterprise
  ГиперссылкаЭлементаИзмерения?: StringboolEnterprise
  ГиперссылкаЭлементаШкалыВремени?: StringboolEnterprise
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  РазрешитьНачалоПеретаскивания?: StringboolEnterprise
  РазрешитьПеретаскивание?: StringboolEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  Ширина?: number
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
