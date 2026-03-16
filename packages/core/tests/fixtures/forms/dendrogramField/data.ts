import {
  DendrogramField,
  DendrogramFieldEnterprise,
  DendrogramFieldPartialYAML,
} from "~/metadata/forms/elements/dendrogramField/types"

import {
  fullFormFieldCommonFixture,
  fullFormFieldEnterpriseCommonFixture,
  fullFormFieldPartialYAMLCommonFixture,
} from "~/tests/fixtures/forms/base/formField/rules"
import { RequiredFieldsElement } from "~/tests/types"

export const fullDendrogramField: RequiredFieldsElement<DendrogramField> = {
  itemType: "DendrogramField",
  name: "ПолеДендрограммы",
  title: {
    items: { ru: "Поле дендрограммы" },
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
  },
  ...fullFormFieldCommonFixture,
}

export const fullDendrogramFieldEnterprise = {
  ElementType: "FormField",
  Name: "prefix_ПолеДендрограммы",
  Type: {
    Type: "SystemEnumeration",
    Value: "FormFieldType.DendrogramField",
  },
  Title: "Поле дендрограммы",
  AutoMaxHeight: true,
  AutoMaxWidth: true,
  Height: 200,
  HorizontalStretch: true,
  MaxHeight: 500,
  MaxWidth: 400,
  VerticalStretch: true,
  Width: 300,
  ...fullFormFieldEnterpriseCommonFixture,
} satisfies Required<DendrogramFieldEnterprise>

export const fullDendrogramFieldPartialYAML: DendrogramFieldPartialYAML = {
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
  },

  ...fullFormFieldPartialYAMLCommonFixture,
} satisfies Omit<Required<DendrogramFieldPartialYAML>, "ЗапретитьИспользование" | "Заголовок" | "РазрешитьИспользование">

export const minimalDendrogramField: DendrogramField = {
  itemType: "DendrogramField",
  name: "ПолеДендрограммы",
}

export const minimalDendrogramFieldPartialYAML: DendrogramFieldPartialYAML = {}
