import {
  ProgressBarField,
  ProgressBarFieldEnterprise,
  ProgressBarFieldPartialYAML,
} from "~/metadata/forms/elements/progressBarField/types"

import {
  fullFormFieldCommonFixture,
  fullFormFieldEnterpriseCommonFixture,
  fullFormFieldEnterpriseTableRelatedFixture,
  fullFormFieldPartialYAMLCommonFixture,
  fullFormFieldTableRelatedFixture,
  fullFormFieldTableRelatedPartialYAMLCommonFixture,
} from "~/tests/fixtures/forms/base/formField/rules"
import { RequiredFieldsElement } from "~/tests/types"

export const fullProgressBarField: RequiredFieldsElement<ProgressBarField> = {
  itemType: "ProgressBarField",
  name: "ПолеИндикатора",
  title: {
    items: { ru: "Поле индикатора" },
  },
  autoMaxHeight: true,
  autoMaxWidth: true,
  borderColor: { type: "WebColor", value: "Black" },
  height: 200,
  horizontalStretch: true,
  maxHeight: 500,
  maxValue: 100,
  maxWidth: 400,
  minValue: 0,
  orientation: "Horizontal",
  representation: "Smooth",
  showPercent: true,
  verticalStretch: true,
  width: 300,
  events: {
    onChange: "ПроцедураПриИзменении",
  },
  ...fullFormFieldCommonFixture,
  ...fullFormFieldTableRelatedFixture,
} satisfies RequiredFieldsElement<ProgressBarField>

export const fullProgressBarFieldEnterprise = {
  ElementType: "FormField",
  Name: "prefix_ПолеИндикатора",
  Type: { Type: "SystemEnumeration", Value: "FormFieldType.ProgressBarField" },
  Title: "Поле индикатора",
  AutoMaxHeight: true,
  AutoMaxWidth: true,
  BorderColor: { Type: "Color", Value: "WebColors.Black" },
  Height: 200,
  HorizontalStretch: true,
  MaxHeight: 500,
  MaxValue: 100,
  MaxWidth: 400,
  MinValue: 0,
  Orientation: {
    Type: "SystemEnumeration",
    Value: "FormItemOrientation.Horizontal",
  },
  Representation: {
    Type: "SystemEnumeration",
    Value: "ProgressBarSmoothingMode.Smooth",
  },
  ShowPercent: true,
  VerticalStretch: true,
  Width: 300,
  ...fullFormFieldEnterpriseCommonFixture,
  ...fullFormFieldEnterpriseTableRelatedFixture,
} satisfies Required<ProgressBarFieldEnterprise>

export const fullProgressBarFieldPartialYAML: ProgressBarFieldPartialYAML = {
  АвтоМаксимальнаяВысота: "Истина",
  АвтоМаксимальнаяШирина: "Истина",
  Высота: 200,
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  МаксимальноеЗначение: 100,
  МинимальноеЗначение: 0,
  Ориентация: "Горизонтально",
  ОтображатьПроценты: "Истина",
  Отображение: "Плавный",
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  ЦветРамки: "Черный",
  Ширина: 300,
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
  },

  ...fullFormFieldPartialYAMLCommonFixture,
  ...fullFormFieldTableRelatedPartialYAMLCommonFixture,
} satisfies Omit<
  Required<ProgressBarFieldPartialYAML>,
  "ЗапретитьИспользование" | "Заголовок" | "РазрешитьИспользование"
>

export const minimalProgressBarField: ProgressBarField = {
  itemType: "ProgressBarField",
  name: "ПолеИндикатора",
}

export const minimalProgressBarFieldPartialYAML: ProgressBarFieldPartialYAML = {}
