import { ChartField, ChartFieldEnterprise, ChartFieldPartialYAML } from "~/metadata/forms/elements/chartField/types"

import {
  fullFormFieldCommonFixture,
  fullFormFieldEnterpriseCommonFixture,
  fullFormFieldPartialYAMLCommonFixture,
} from "~/tests/fixtures/forms/base/formField/rules"
import { RequiredFieldsElement } from "~/tests/types"

export const fullChartField: RequiredFieldsElement<ChartField> = {
  itemType: "ChartField",
  name: "ПолеДиаграммы",
  title: {
    items: { ru: "Поле диаграммы" },
  },
  autoMaxHeight: false,
  autoMaxWidth: false,
  height: 200,
  horizontalStretch: false,
  maxHeight: 500,
  maxWidth: 400,
  verticalStretch: false,
  width: 300,
  events: {
    onChange: "ПроцедураПриИзменении",
    selection: "ПроцедураВыбора",
    detailProcessing: "ПроцедураОбработкиРасшифровки",
    onActivate: "ПроцедураПриАктивизации",
  },
  ...fullFormFieldCommonFixture,
} as const satisfies RequiredFieldsElement<ChartField>

export const fullChartFieldEnterprise = {
  Name: "prefix_ПолеДиаграммы",
  Type: { Type: "SystemEnumeration", Value: "FormFieldType.ChartField" },
  ElementType: "FormField",
  Title: "Поле диаграммы",
  AutoMaxHeight: false,
  AutoMaxWidth: false,
  Height: 200,
  HorizontalStretch: false,
  MaxHeight: 500,
  MaxWidth: 400,
  VerticalStretch: false,
  Width: 300,
  ...fullFormFieldEnterpriseCommonFixture,
} satisfies Required<ChartFieldEnterprise>

export const fullChartFieldPartialYAML: ChartFieldPartialYAML = {
  АвтоМаксимальнаяВысота: "Ложь",
  АвтоМаксимальнаяШирина: "Ложь",
  Высота: 200,
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  РастягиватьПоВертикали: "Ложь",
  РастягиватьПоГоризонтали: "Ложь",
  Заголовок: "Поле диаграммы",
  Ширина: 300,
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
    Выбор: "ПроцедураВыбора",
    ОбработкаРасшифровки: "ПроцедураОбработкиРасшифровки",
    ПриАктивизации: "ПроцедураПриАктивизации",
  },
  ...fullFormFieldPartialYAMLCommonFixture,
} satisfies Omit<Required<ChartFieldPartialYAML>, "ЗапретитьИспользование" | "РазрешитьИспользование">

export const minimalChartField: ChartField = {
  itemType: "ChartField",
  name: "ПолеДиаграммы",
}

export const minimalChartFieldPartialYAML: ChartFieldPartialYAML = {}
