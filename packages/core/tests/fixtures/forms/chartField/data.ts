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
  autoMaxHeight: true,
  autoMaxWidth: true,
  height: 200,
  horizontalStretch: true,
  maxHeight: 500,
  maxWidth: 400,
  verticalStretch: true,
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
  // Явно задаём DataPath, чтобы он совпадал с результатом exportElementToEnterprise
  DataPath: "prefix_Реквизит",
  Name: "prefix_ПолеДиаграммы",
  Type: { Type: "SystemEnumeration", Value: "FormFieldType.ChartField" },
  ElementType: "FormField",
  Title: "Поле диаграммы",
  AutoMaxHeight: true,
  AutoMaxWidth: true,
  Height: 200,
  HorizontalStretch: true,
  MaxHeight: 500,
  MaxWidth: 400,
  VerticalStretch: true,
  Width: 300,
  ...fullFormFieldEnterpriseCommonFixture,
} satisfies Required<ChartFieldEnterprise>

export const fullChartFieldPartialYAML: ChartFieldPartialYAML = {
  АвтоМаксимальнаяВысота: "Истина",
  АвтоМаксимальнаяШирина: "Истина",
  Высота: 200,
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  Ширина: 300,
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
    Выбор: "ПроцедураВыбора",
    ОбработкаРасшифровки: "ПроцедураОбработкиРасшифровки",
    ПриАктивизации: "ПроцедураПриАктивизации",
  },
  ...fullFormFieldPartialYAMLCommonFixture,
} satisfies Omit<Required<ChartFieldPartialYAML>, "ЗапретитьИспользование" | "Заголовок" | "РазрешитьИспользование">

export const minimalChartField: ChartField = {
  itemType: "ChartField",
  name: "ПолеДиаграммы",
}

export const minimalChartFieldPartialYAML: ChartFieldPartialYAML = {}
