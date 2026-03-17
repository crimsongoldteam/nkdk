import {
  PeriodField,
  PeriodFieldEnterprise,
  PeriodFieldPartialYAML,
  PeriodFieldTypedYAML,
} from "~/metadata/forms/elements/periodField/types"

import {
  fullFormFieldCommonFixture,
  fullFormFieldEnterpriseCommonFixture,
  fullFormFieldPartialYAMLCommonFixture,
} from "~/tests/fixtures/forms/base/formField/rules"
import { RequiredFieldsElement } from "~/tests/types"

export const fullPeriodField: RequiredFieldsElement<PeriodField> = {
  itemType: "PeriodField",
  name: "ПолеПериода",
  title: {
    items: { ru: "Поле периода" },
  },
  autoMaxHeight: false,
  autoMaxWidth: false,
  border: {
    controlBorderType: "Single",
    width: 0,
  },
  borderColor: { type: "WebColor", value: "Black" },
  font: { kind: "StyleItem", ref: "NormalTextFont" },
  height: 200,
  horizontalStretch: false,
  maxHeight: 500,
  maxWidth: 400,
  verticalStretch: false,
  width: 300,
  events: {
    onChange: "ПроцедураПриИзменении",
    selection: "ПроцедураВыбора",
  },
  ...fullFormFieldCommonFixture,
} as RequiredFieldsElement<PeriodField>

export const fullPeriodFieldEnterprise = {
  Name: "prefix_ПолеПериода",
  Type: { Type: "SystemEnumeration", Value: "FormFieldType.PeriodField" },
  ElementType: "FormField",
  Title: "Поле периода",
  Font: { Type: "Font", Value: "StyleFonts.NormalTextFont" },
  AutoMaxHeight: false,
  AutoMaxWidth: false,
  Border: { Type: "Border", Value: "ControlBorderType.Single" },
  BorderColor: { Type: "Color", Value: "WebColors.Black" },
  Height: 200,
  HorizontalStretch: false,
  MaxHeight: 500,
  MaxWidth: 400,
  VerticalStretch: false,
  Width: 300,
  ...fullFormFieldEnterpriseCommonFixture,
} satisfies Required<PeriodFieldEnterprise>

export const fullPeriodFieldPartialYAML: PeriodFieldPartialYAML = {
  Высота: 200,
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  Рамка: { ТипРамки: "Одинарная", Ширина: 0 },
  РастягиватьПоВертикали: "Ложь",
  РастягиватьПоГоризонтали: "Ложь",
  ЦветРамки: "Черный",
  Ширина: 300,
  Шрифт: "ОбычныйШрифтТекста",
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
    Выбор: "ПроцедураВыбора",
  },
  АвтоМаксимальнаяВысота: "Ложь",
  АвтоМаксимальнаяШирина: "Ложь",
  ...fullFormFieldPartialYAMLCommonFixture,
} satisfies Omit<Required<PeriodFieldPartialYAML>, "ЗапретитьИспользование" | "Заголовок" | "РазрешитьИспользование">

export const fullPeriodFieldTypedYAML: PeriodFieldTypedYAML = {
  ...fullPeriodFieldPartialYAML,
  Тип: "ПолеПериода",
  Заголовок: "Поле периода",
}

export const minimalPeriodField: PeriodField = {
  itemType: "PeriodField",
  name: "ПолеПериода",
}

export const minimalPeriodFieldPartialYAML: PeriodFieldPartialYAML = {}

export const minimalPeriodFieldTypedYAML: PeriodFieldTypedYAML = {
  Тип: "ПолеПериода",
}
