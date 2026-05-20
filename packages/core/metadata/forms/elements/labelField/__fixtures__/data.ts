import {
  LabelField,
  LabelFieldEnterprise,
  LabelFieldPartialYAML,
  TableLabelField,
  TableLabelFieldEnterprise,
  TableLabelFieldPartialYAML,
  TableLabelFieldTypedYAML,
} from "~/metadata/forms/elements/labelField/types"

import { StructureResult } from "~/tests/types"
import {
  fullFormFieldCommonFixture,
  fullFormFieldEnterpriseCommonFixture,
  fullFormFieldEnterpriseTableRelatedFixture,
  fullFormFieldPartialYAMLCommonFixture,
  fullFormFieldTableRelatedFixture,
  fullFormFieldTableRelatedPartialYAMLCommonFixture,
} from "~/tests/fixtures/forms/base/formField/rules"
import { RequiredFieldsElement } from "~/tests/types"

export const fullLabelField: RequiredFieldsElement<LabelField> = {
  itemType: "LabelField",
  name: "ПолеНадписи",
  title: {
    items: { ru: "Поле надписи" },
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

export const fullTableLabelField: RequiredFieldsElement<TableLabelField> = {
  ...fullLabelField,
  itemType: "TableLabelField",
  ...fullFormFieldTableRelatedFixture,
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
  ПутьКДанным: "Реквизит",
  ...fullFormFieldPartialYAMLCommonFixture,
} satisfies Omit<Required<LabelFieldPartialYAML>, "ЗапретитьИспользование" | "Заголовок" | "РазрешитьИспользование">

export const fullTableLabelFieldPartialYAML: TableLabelFieldPartialYAML = {
  ...fullLabelFieldPartialYAML,
  ...fullFormFieldTableRelatedPartialYAMLCommonFixture,
}

export const fullTableLabelFieldTypedYAML: TableLabelFieldTypedYAML = {
  ...fullTableLabelFieldPartialYAML,
  Тип: "ПолеНадписи",
  Заголовок: "Поле надписи",
  ПутьКДанным: "Реквизит",
}

export const minimalLabelField: LabelField = {
  itemType: "LabelField",
  name: "ПолеНадписи",
}

export const minimalLabelFieldPartialYAML: LabelFieldPartialYAML = {}

export const minimalTableLabelField: TableLabelField = {
  itemType: "TableLabelField",
  name: "ПолеНадписи",
}

export const minimalTableLabelFieldPartialYAML: TableLabelFieldPartialYAML = {}

export const minimalTableLabelFieldTypedYAML: TableLabelFieldTypedYAML = {
  Тип: "ПолеНадписи",
}

export interface LabelFieldStructureFixture {
  name: string
  element: LabelField
  structured: StructureResult
  content: StructureResult
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

export const fullLabelFieldEnterprise = {
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
} satisfies Required<LabelFieldEnterprise>

export const fullTableLabelFieldEnterprise = {
  ...fullLabelFieldEnterprise,
  ...fullFormFieldEnterpriseTableRelatedFixture,
} satisfies Required<TableLabelFieldEnterprise>
