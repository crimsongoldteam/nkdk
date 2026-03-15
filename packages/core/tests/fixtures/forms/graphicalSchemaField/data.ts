import {
  GraphicalSchemaField,
  GraphicalSchemaFieldEnterprise,
  GraphicalSchemaFieldPartialYAML,
} from "~/metadata/forms/elements/graphicalSchemaField/types"

import {
  fullFormFieldCommonFixture,
  fullFormFieldEnterpriseCommonFixture,
  fullFormFieldPartialYAMLCommonFixture,
} from "~/tests/fixtures/forms/base/formField/rules"
import { RequiredFieldsElement } from "~/tests/types"

export const fullGraphicalSchemaField: RequiredFieldsElement<GraphicalSchemaField> = {
  itemType: "GraphicalSchemaField",
  name: "ПолеГрафическойСхемы",
  title: {
    items: { ru: "Поле графической схемы" },
  },
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  autoMaxHeight: true,
  autoMaxWidth: true,
  borderColor: { type: "WebColor", value: "Black" },
  edit: true,
  height: 200,
  horizontalStretch: true,
  maxHeight: 500,
  maxWidth: 400,
  output: "Enable",
  verticalStretch: true,
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
}

export const fullGraphicalSchemaFieldEnterprise = {
  Name: "prefix_ПолеГрафическойСхемы",
  Type: {
    Type: "SystemEnumeration",
    Value: "FormFieldType.GraphicalSchemaField",
  },
  Title: "Поле графической схемы",
  AutoMaxHeight: true,
  AutoMaxWidth: true,
  BorderColor: {
    Type: "Color",
    Value: "WebColors.Black",
  },
  Edit: true,
  Height: 200,
  HorizontalStretch: true,
  MaxHeight: 500,
  MaxWidth: 400,
  Output: {
    Type: "SystemEnumeration",
    Value: "UseOutput.Enable",
  },
  VerticalStretch: true,
  Width: 300,
  ...fullFormFieldEnterpriseCommonFixture,
} satisfies Required<GraphicalSchemaFieldEnterprise>

export const fullGraphicalSchemaFieldPartialYAML: GraphicalSchemaFieldPartialYAML = {
  АвтоМаксимальнаяВысота: "Истина",
  АвтоМаксимальнаяШирина: "Истина",
  Вывод: "Разрешить",
  Высота: 200,
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  Редактирование: "Истина",
  ЦветРамки: "Черный",
  Ширина: 300,
  РазрешитьИспользование: { Администратор: "Истина" },
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
    Выбор: "ПроцедураВыбора",
    ПередЗаписью: "ПроцедураПередЗаписью",
    ПередПечатью: "ПроцедураПередПечатью",
    ПослеЗаписи: "ПроцедураПослеЗаписи",
    ПриАктивизации: "ПроцедураАктивации",
  },
  ...fullFormFieldPartialYAMLCommonFixture,
}

export const minimalGraphicalSchemaField: GraphicalSchemaField = {
  itemType: "GraphicalSchemaField",
  name: "ПолеГрафическойСхемы",
}

export const minimalGraphicalSchemaFieldPartialYAML: GraphicalSchemaFieldPartialYAML = {}
