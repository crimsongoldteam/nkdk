import { StringboolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "~/lib/metadata/forms/elements/formField/types"
import { EventsXML } from "~/lib/metadata/forms/events/types"

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
  verticalStretch?: boolean
  width?: number
  wrappedTimeScaleHeaderHyperlink?: boolean
  userVisible?: UserVisible
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
  VerticalStretch?: boolean
  Width?: number
  WrappedTimeScaleHeaderHyperlink?: boolean
  UserVisible?: UserVisibleXML
  Events?: EventsXML
}

export interface PlannerFieldEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  ГиперссылкаЭлементаИзмерения?: StringboolEnterprise
  РазрешитьПеретаскивание?: StringboolEnterprise
  РазрешитьНачалоПеретаскивания?: StringboolEnterprise
  Высота?: number
  РастягиватьПоГоризонтали?: StringboolEnterprise
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  ГиперссылкаЭлементаШкалыВремени?: StringboolEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  Ширина?: number
  ГиперссылкаПеренесенногоЗаголовкаШкалыВремени?: StringboolEnterprise
  ПользовательскаяВидимостьРазрешить?: UserVisibleEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleEnterprise
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
