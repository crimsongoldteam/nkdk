import { DendrogramField, DendrogramFieldEnterprise, DendrogramFieldPartialYAML } from "../types"

import {
  fullFormFieldCommonFixture,
  fullFormFieldEnterpriseCommonFixture,
  fullFormFieldPartialYAMLCommonFixture,
} from "../../__fixtures__/formField/rules"
import { RequiredFieldsElement } from "../../../../../tests/types"

export const fullDendrogramField: RequiredFieldsElement<DendrogramField> = {
  itemType: "DendrogramField",
  name: "ПолеДендрограммы",
  title: {
    items: { ru: "Поле дендрограммы" },
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
  AutoMaxHeight: false,
  AutoMaxWidth: false,
  Height: 200,
  HorizontalStretch: false,
  MaxHeight: 500,
  MaxWidth: 400,
  VerticalStretch: false,
  Width: 300,
  ...fullFormFieldEnterpriseCommonFixture,
} satisfies Required<DendrogramFieldEnterprise>

export const fullDendrogramFieldPartialYAML: DendrogramFieldPartialYAML = {
  АвтоМаксимальнаяВысота: "Ложь",
  АвтоМаксимальнаяШирина: "Ложь",
  Высота: 200,
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  РастягиватьПоВертикали: "Ложь",
  РастягиватьПоГоризонтали: "Ложь",
  Заголовок: "Поле дендрограммы",
  Ширина: 300,
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
    Выбор: "ПроцедураВыбора",
    ОбработкаРасшифровки: "ПроцедураОбработкиРасшифровки",
  },

  ...fullFormFieldPartialYAMLCommonFixture,
} satisfies Omit<Required<DendrogramFieldPartialYAML>, "Использование">

export const minimalDendrogramField: DendrogramField = {
  itemType: "DendrogramField",
  name: "ПолеДендрограммы",
}

export const minimalDendrogramFieldPartialYAML: DendrogramFieldPartialYAML = {}
