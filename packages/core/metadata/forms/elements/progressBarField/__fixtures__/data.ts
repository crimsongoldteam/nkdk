import {
  ProgressBarField,
  ProgressBarFieldEnterprise,
  ProgressBarFieldPartialYAML,
} from "~/metadata/forms/elements/progressBarField/types"

import {
  fullFormFieldCommonFixture,
  fullFormFieldEnterpriseCommonFixture,
  fullFormFieldPartialYAMLCommonFixture,
} from "~/metadata/forms/elements/__fixtures__/formField/rules"
import { RequiredFieldsElement } from "~/tests/types"

export const fullProgressBarField = {
  itemType: "ProgressBarField",
  name: "ПолеИндикатора",
  title: {
    items: { ru: "Поле индикатора" },
  },
  autoMaxHeight: false,
  autoMaxWidth: false,
  borderColor: { type: "WebColor", value: "Black" },
  height: 200,
  horizontalStretch: false,
  maxHeight: 500,
  maxWidth: 400,
  showPercent: true,
  width: 300,
  maxValue: 90,
  minValue: 10,
  orientation: "Vertical",
  representation: "Broken",
  verticalStretch: false,
  events: {
    onChange: "ПроцедураПриИзменении",
  },
  ...fullFormFieldCommonFixture,
} satisfies RequiredFieldsElement<ProgressBarField>

export const fullProgressBarFieldEnterprise = {
  ElementType: "FormField",
  Name: "prefix_ПолеИндикатора",
  Type: { Type: "SystemEnumeration", Value: "FormFieldType.ProgressBarField" },
  Title: "Поле индикатора",
  AutoMaxHeight: false,
  AutoMaxWidth: false,
  BorderColor: { Type: "Color", Value: "WebColors.Black" },
  Height: 200,
  HorizontalStretch: false,
  MaxHeight: 500,
  MaxValue: 90,
  MaxWidth: 400,
  MinValue: 10,
  Orientation: {
    Type: "SystemEnumeration",
    Value: "FormItemOrientation.Vertical",
  },
  Representation: {
    Type: "SystemEnumeration",
    Value: "ProgressBarSmoothingMode.Broken",
  },
  ShowPercent: true,
  VerticalStretch: false,
  Width: 300,
  ...fullFormFieldEnterpriseCommonFixture,
} satisfies Required<ProgressBarFieldEnterprise>

export const fullProgressBarFieldPartialYAML: ProgressBarFieldPartialYAML = {
  АвтоМаксимальнаяВысота: "Ложь",
  АвтоМаксимальнаяШирина: "Ложь",
  Высота: 200,
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  МаксимальноеЗначение: 90,
  МинимальноеЗначение: 10,
  Ориентация: "Вертикально",
  ОтображатьПроценты: "Истина",
  Отображение: "Прерывистый",
  РастягиватьПоГоризонтали: "Ложь",
  ЦветРамки: "Черный",
  Заголовок: "Поле индикатора",
  Ширина: 300,
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
  },

  ...fullFormFieldPartialYAMLCommonFixture,
}

export const minimalProgressBarField: ProgressBarField = {
  itemType: "ProgressBarField",
  name: "ПолеИндикатора",
}

export const minimalProgressBarFieldPartialYAML: ProgressBarFieldPartialYAML = {}
