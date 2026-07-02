import { GraphicalSchemaField, GraphicalSchemaFieldEnterprise, GraphicalSchemaFieldPartialYAML } from "../types"

import {
  fullFormFieldCommonFixture,
  fullFormFieldEnterpriseCommonFixture,
  fullFormFieldPartialYAMLCommonFixture,
} from "../../__fixtures__/formField/rules"
import { RequiredFieldsElement } from "../../../../../tests/types"

export const fullGraphicalSchemaField = {
  itemType: "GraphicalSchemaField",
  name: "ПолеГрафическойСхемы",
  title: {
    items: { ru: "Поле графической схемы" },
  },
  autoMaxHeight: false,
  autoMaxWidth: false,
  borderColor: { type: "WebColor", value: "Black" },
  commandSet: ["AlignBottom", "InsertItemActivity", "Ungroup"],
  height: 200,
  horizontalStretch: false,
  maxHeight: 500,
  maxWidth: 400,
  output: "Enable",
  verticalStretch: false,
  width: 300,
  events: {
    onChange: "ПроцедураПриИзменении",
    selection: "ПроцедураВыбора",
    beforeWrite: "ПроцедураПередЗаписью",
    beforePrint: "ПроцедураПередПечатью",
    afterWrite: "ПроцедураПослеЗаписи",
    onActivate: "ПроцедураАктивации",
  },
  ...fullFormFieldCommonFixture,
} satisfies Omit<RequiredFieldsElement<GraphicalSchemaField>, "edit">

export const fullGraphicalSchemaFieldEnterprise = {
  ElementType: "FormField",
  Name: "prefix_ПолеГрафическойСхемы",
  Type: {
    Type: "SystemEnumeration",
    Value: "FormFieldType.GraphicalSchemaField",
  },
  Title: "Поле графической схемы",
  AutoMaxHeight: false,
  AutoMaxWidth: false,
  BorderColor: {
    Type: "Color",
    Value: "WebColors.Black",
  },
  Height: 200,
  HorizontalStretch: false,
  MaxHeight: 500,
  MaxWidth: 400,
  Output: {
    Type: "SystemEnumeration",
    Value: "UseOutput.Enable",
  },
  VerticalStretch: false,
  Width: 300,
  ...fullFormFieldEnterpriseCommonFixture,
} satisfies Required<GraphicalSchemaFieldEnterprise>

export const fullGraphicalSchemaFieldPartialYAML: GraphicalSchemaFieldPartialYAML = {
  АвтоМаксимальнаяВысота: "Ложь",
  АвтоМаксимальнаяШирина: "Ложь",
  Вывод: "Разрешить",
  Высота: 200,
  Команда: ["AlignBottom", "InsertItemActivity", "Ungroup"],
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  РастягиватьПоВертикали: "Ложь",
  РастягиватьПоГоризонтали: "Ложь",
  ЦветРамки: "Черный",
  Заголовок: "Поле графической схемы",
  Ширина: 300,
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
    Выбор: "ПроцедураВыбора",
    ПередЗаписью: "ПроцедураПередЗаписью",
    ПередПечатью: "ПроцедураПередПечатью",
    ПослеЗаписи: "ПроцедураПослеЗаписи",
    ПриАктивизации: "ПроцедураАктивации",
  },
  ...fullFormFieldPartialYAMLCommonFixture,
} satisfies Omit<Required<GraphicalSchemaFieldPartialYAML>, "Использование">

export const minimalGraphicalSchemaField: GraphicalSchemaField = {
  itemType: "GraphicalSchemaField",
  name: "ПолеГрафическойСхемы",
}

export const minimalGraphicalSchemaFieldPartialYAML: GraphicalSchemaFieldPartialYAML = {}
