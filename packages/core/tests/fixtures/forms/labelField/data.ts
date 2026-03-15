import {
  LabelField,
  LabelFieldEnterprise,
  LabelFieldPartialYAML,
  LabelFieldTypedYAML,
} from "~/metadata/forms/elements/labelField/types"

import { ToNKDKResult } from "~/metadata/orchestration/formElement/toNKDK/types"
import {
  fullFormFieldCommonFixture,
  fullFormFieldEnterpriseCommonFixture,
  fullFormFieldPartialYAMLCommonFixture,
} from "~/tests/fixtures/forms/base/formField/rules"
import { RequiredFieldsElement } from "~/tests/types"

export const fullLabelField: RequiredFieldsElement<LabelField> = {
  itemType: "LabelField",
  name: "ПолеНадписи",
  title: {
    items: { ru: "Поле надписи" },
  },
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  autoMaxHeight: true,
  autoMaxWidth: true,
  backColor: { type: "WebColor", value: "Blue" },
  border: {
    controlBorderType: "Single",
  },
  borderColor: { type: "WebColor", value: "Green" },
  font: { kind: "StyleItem", ref: "NormalTextFont" },
  format: { items: { ru: "Формат" } },
  height: 200,
  horizontalStretch: true,
  hyperlink: true,
  markNegatives: true,
  maxHeight: 500,
  maxWidth: 400,
  passwordMode: true,
  textColor: { type: "WebColor", value: "Yellow" },
  verticalStretch: true,
  width: 300,
  events: {
    onChange: "ПроцедураПриИзменении",
    click: "ПроцедураНажатия",
    uRLProcessing: "ПроцедураОбработкиURL",
  },
  ...fullFormFieldCommonFixture,
}

export const fullLabelFieldPartialYAML: LabelFieldPartialYAML = {
  Рамка: { ТипРамки: "Одинарная" },
  ЦветРамки: "Зеленый",
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  ВыделятьОтрицательные: "Истина",
  ЦветТекста: "Желтый",
  ЦветФона: "Синий",
  Ширина: 300,
  Шрифт: "ОбычныйШрифтТекста",
  Формат: "Формат",
  Гиперссылка: "Истина",
  РежимПароля: "Истина",
  Высота: 200,
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
    Нажатие: "ПроцедураНажатия",
    ОбработкаНавигационнойСсылки: "ПроцедураОбработкиURL",
  },
  АвтоМаксимальнаяВысота: "Истина",
  АвтоМаксимальнаяШирина: "Истина",
  ...fullFormFieldPartialYAMLCommonFixture,
} satisfies Omit<Required<LabelFieldPartialYAML>, "ЗапретитьИспользование" | "Заголовок">

export const fullLabelFieldTypedYAML: LabelFieldTypedYAML = {
  ...fullLabelFieldPartialYAML,
  Тип: "ПолеНадписи",
  Заголовок: "Поле надписи",
}

export const minimalLabelField: LabelField = {
  itemType: "LabelField",
  name: "ПолеНадписи",
}

export const minimalLabelFieldPartialYAML: LabelFieldPartialYAML = {}

export const minimalLabelFieldTypedYAML: LabelFieldTypedYAML = {
  Тип: "ПолеНадписи",
}

export interface LabelFieldStructureFixture {
  name: string
  element: LabelField
  structured: ToNKDKResult
  content: ToNKDKResult
}

export const labelFieldStructureFixturesTable: LabelFieldStructureFixture[] = [
  {
    name: "with title",
    element: {
      name: "ПолеНадписи",
      itemType: "LabelField",
      title: { items: { ru: "Поле надписи" } },
      dataPath: "ПолеНадписи",
    },
    structured: {
      strings: ['~"Поле надписи": ПолеНадписи'],
      toOneLineGroup: true,
    },
    content: {
      strings: ['~"Поле надписи" ПолеНадписи'],
      toOneLineGroup: true,
    },
  },
  {
    name: "without title",
    element: {
      name: "ПолеНадписи",
      itemType: "LabelField",
      dataPath: "ПолеНадписи",
    },
    structured: {
      strings: ["~ПолеНадписи: "],
      toOneLineGroup: true,
    },
    content: {
      strings: ["~ПолеНадписи"],
      toOneLineGroup: true,
    },
  },
]

export const fullLabelFieldEnterprise: Required<LabelFieldEnterprise> = {
  Name: "prefix_ПолеНадписи",
  Type: { Type: "SystemEnumeration", Value: "FormFieldType.LabelField" },
  ElementType: "FormField",
  Title: "Поле надписи",
  AutoMaxHeight: true,
  AutoMaxWidth: true,
  BackColor: { Type: "Color", Value: "WebColors.Blue" },
  Border: { Type: "Border", Value: "ControlBorderType.Single" },
  BorderColor: { Type: "Color", Value: "WebColors.Green" },
  Font: { Type: "Font", Value: "StyleFonts.NormalTextFont" },
  Format: "Формат",
  Height: 200,
  HorizontalStretch: true,
  Hyperlink: true,
  MarkNegatives: true,
  MaxHeight: 500,
  MaxWidth: 400,
  PasswordMode: true,
  TextColor: { Type: "Color", Value: "WebColors.Yellow" },
  VerticalStretch: true,
  Width: 300,
  ...fullFormFieldEnterpriseCommonFixture,
}
