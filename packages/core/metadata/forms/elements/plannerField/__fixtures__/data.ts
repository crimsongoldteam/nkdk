import { PlannerField, PlannerFieldEnterprise, PlannerFieldPartialYAML } from "../types"

import {
  fullFormFieldCommonFixture,
  fullFormFieldEnterpriseCommonFixture,
  fullFormFieldPartialYAMLCommonFixture,
} from "../../__fixtures__/formField/rules"
import { RequiredFieldsElement } from "../../../../../tests/types"

type PlannerFieldWithoutDrag = Omit<PlannerField, "enableDrag" | "enableStartDrag">
type PlannerFieldPartialYAMLWithoutDrag = Omit<
  PlannerFieldPartialYAML,
  "РазрешитьПеретаскивание" | "РазрешитьНачалоПеретаскивания"
>

export const fullPlannerField: RequiredFieldsElement<PlannerFieldWithoutDrag> = {
  itemType: "PlannerField",
  name: "ПолеПланировщика",
  title: {
    items: { ru: "Поле планировщика" },
  },
  autoMaxHeight: false,
  autoMaxWidth: false,
  commandSet: ["Begin"],
  dimensionItemHyperlink: true,
  // enableDrag: undefined as never,
  // enableStartDrag: undefined as never,
  height: 200,
  horizontalStretch: false,
  maxHeight: 10,
  maxWidth: 5,
  timeScaleItemHyperlink: true,
  verticalStretch: false,
  width: 300,
  wrappedTimeScaleHeaderHyperlink: true,
  events: {
    onChange: "ПроцедураПриИзменении",
    selection: "ПроцедураВыбора",
    plannerActionClick: "ПроцедураНажатияНаПланировщике",
    uRLClick: "ПроцедураНажатияНаСсылке",
    wrappedTimeScaleHeaderClick: "ПроцедураНажатияНаЗаголовке",
    dimensionItemClick: "ПроцедураНажатияНаЭлементе",
    timeScaleItemClick: "ПроцедураНажатияНаЭлементе",
    dragStart: "ПроцедураНачалаПеретаскивания",
    commandGenerateProcessing: "ПроцедураГенерацииКоманды",
    dragEnd: "ПроцедураЗавершенияПеретаскивания",
    beforeStartQuickEdit: "ПроцедураНачалаБыстрогоРедактирования",
    beforeStartEdit: "ПроцедураНачалаРедактирования",
    beforePrint: "ПроцедураПередПечатью",
    beforeExpandDimensionItem: "ПроцедураРазворачиванияЭлемента",
    beforeCollapseDimensionItem: "ПроцедураСворачиванияЭлемента",
    beforeCreate: "ПроцедураСозданияЭлемента",
    beforeDelete: "ПроцедураУдаленияЭлемента",
    drag: "ПроцедураПеретаскивания",
    onActivate: "ПроцедураАктивации",
    onEditEnd: "ПроцедураЗавершенияРедактирования",
    onCurrentRepresentationPeriodChange: "ПроцедураИзмененияПериода",
    dragCheck: "ПроцедураПроверкиПеретаскивания",
    insideDragCheck: "ПроцедураПроверкиПеретаскиванияВнутри",
  },
  ...fullFormFieldCommonFixture,
}

export const fullPlannerFieldEnterprise = {
  ElementType: "FormField",
  Name: "prefix_ПолеПланировщика",
  Type: {
    Type: "SystemEnumeration",
    Value: "FormFieldType.PlannerField",
  },
  Title: "Поле планировщика",
  AutoMaxHeight: false,
  AutoMaxWidth: false,
  DimensionItemHyperlink: true,
  // EnableDrag: undefined as never,
  // EnableStartDrag: undefined as never,
  Height: 200,
  HorizontalStretch: false,
  MaxHeight: 10,
  MaxWidth: 5,
  TimeScaleItemHyperlink: true,
  VerticalStretch: false,
  Width: 300,
  WrappedTimeScaleHeaderHyperlink: true,
  ...fullFormFieldEnterpriseCommonFixture,
} satisfies Required<PlannerFieldEnterprise>

export const fullPlannerFieldPartialYAML: PlannerFieldPartialYAML = {
  ПутьКДанным: "Реквизит",
  АвтоМаксимальнаяВысота: "Ложь",
  АвтоМаксимальнаяШирина: "Ложь",
  Команда: ["Begin"],
  ГиперссылкаЭлементаИзмерения: "Истина",
  // РазрешитьПеретаскивание: undefined as never,
  // РазрешитьНачалоПеретаскивания: undefined as never,
  Высота: 200,
  МаксимальнаяВысота: 10,
  МаксимальнаяШирина: 5,
  ГиперссылкаЭлементаШкалыВремени: "Истина",
  РастягиватьПоВертикали: "Ложь",
  РастягиватьПоГоризонтали: "Ложь",
  Заголовок: "Поле планировщика",
  Ширина: 300,
  ГиперссылкаПеренесенногоЗаголовкаШкалыВремени: "Истина",
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
    Выбор: "ПроцедураВыбора",
    НажатиеНаДействиеПланировщика: "ПроцедураНажатияНаПланировщике",
    НажатиеНаНавигационнойСсылке: "ПроцедураНажатияНаСсылке",
    НажатиеНаПеренесенномЗаголовкеШкалыВремени: "ПроцедураНажатияНаЗаголовке",
    НажатиеНаЭлементеИзмерения: "ПроцедураНажатияНаЭлементе",
    НажатиеНаЭлементеШкалыВремени: "ПроцедураНажатияНаЭлементе",
    НачалоПеретаскивания: "ПроцедураНачалаПеретаскивания",
    ОбработкаФормированияКоманд: "ПроцедураГенерацииКоманды",
    ОкончаниеПеретаскивания: "ПроцедураЗавершенияПеретаскивания",
    ПередНачаломБыстрогоРедактирования: "ПроцедураНачалаБыстрогоРедактирования",
    ПередНачаломРедактирования: "ПроцедураНачалаРедактирования",
    ПередПечатью: "ПроцедураПередПечатью",
    ПередРазворачиваниемЭлементаИзмерения: "ПроцедураРазворачиванияЭлемента",
    ПередСворачиваниемЭлементаИзмерения: "ПроцедураСворачиванияЭлемента",
    ПередСозданием: "ПроцедураСозданияЭлемента",
    ПередУдалением: "ПроцедураУдаленияЭлемента",
    Перетаскивание: "ПроцедураПеретаскивания",
    ПриАктивизации: "ПроцедураАктивации",
    ПриОкончанииРедактирования: "ПроцедураЗавершенияРедактирования",
    ПриСменеТекущегоПериодаОтображения: "ПроцедураИзмененияПериода",
    ПроверкаПеретаскивания: "ПроцедураПроверкиПеретаскивания",
    ПроверкаПеретаскиванияВнутри: "ПроцедураПроверкиПеретаскиванияВнутри",
  },
  ...fullFormFieldPartialYAMLCommonFixture,
} satisfies Omit<Required<PlannerFieldPartialYAMLWithoutDrag>, "Использование">

export const dragPlannerField: PlannerField = {
  itemType: "PlannerField",
  name: "ПолеПланировщика",
  enableDrag: true,
  enableStartDrag: true,
}

export const dragPlannerFieldEnterprise: PlannerFieldEnterprise = {
  ElementType: "FormField",
  Name: "prefix_ПолеПланировщика",
  Type: {
    Type: "SystemEnumeration",
    Value: "FormFieldType.PlannerField",
  },
}

export const dragPlannerFieldPartialYAML: PlannerFieldPartialYAML = {
  РазрешитьПеретаскивание: "Истина",
  РазрешитьНачалоПеретаскивания: "Истина",
}

export const minimalPlannerField: PlannerField = {
  itemType: "PlannerField",
  name: "ПолеПланировщика",
}

export const minimalPlannerFieldPartialYAML: PlannerFieldPartialYAML = {}
