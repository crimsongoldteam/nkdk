import {
  GraphicalSchemaField,
  GraphicalSchemaFieldEnterprise,
  GraphicalSchemaFieldPartialYAML,
} from "~/metadata/forms/elements/graphicalSchemaField/types"

import {
  fullFormFieldCommonFixture,
  fullFormFieldEnterpriseCommonFixture,
  fullFormFieldEnterpriseTableRelatedFixture,
  fullFormFieldPartialYAMLCommonFixture,
  fullFormFieldTableRelatedFixture,
  fullFormFieldTableRelatedPartialYAMLCommonFixture,
} from "~/tests/fixtures/forms/base/formField/rules"
import { RequiredFieldsElement } from "~/tests/types"

export const fullGraphicalSchemaField: RequiredFieldsElement<GraphicalSchemaField> = {
  itemType: "GraphicalSchemaField",
  name: "ПолеГрафическойСхемы",
  title: {
    items: { ru: "Поле графической схемы" },
  },
  autoMaxHeight: false,
  autoMaxWidth: false,
  borderColor: { type: "WebColor", value: "Black" },
  height: 200,
  horizontalStretch: false,
  maxHeight: 500,
  maxWidth: 400,
  edit: undefined as never,
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
  ...fullFormFieldTableRelatedFixture,
} satisfies RequiredFieldsElement<GraphicalSchemaField>

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
  Edit: undefined as never,
  Output: {
    Type: "SystemEnumeration",
    Value: "UseOutput.Enable",
  },
  VerticalStretch: false,
  Width: 300,
  ...fullFormFieldEnterpriseCommonFixture,
  ...fullFormFieldEnterpriseTableRelatedFixture,
} satisfies Required<GraphicalSchemaFieldEnterprise>

export const fullGraphicalSchemaFieldPartialYAML: GraphicalSchemaFieldPartialYAML = {
  АвтоМаксимальнаяВысота: "Ложь",
  АвтоМаксимальнаяШирина: "Ложь",
  Вывод: "Разрешить",
  Редактирование: undefined as never,
  Высота: 200,
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  РастягиватьПоВертикали: "Ложь",
  РастягиватьПоГоризонтали: "Ложь",
  ЦветРамки: "Черный",
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
  ...fullFormFieldTableRelatedPartialYAMLCommonFixture,
} satisfies Omit<Required<GraphicalSchemaFieldPartialYAML>, "ЗапретитьИспользование" | "Заголовок" | "РазрешитьИспользование">

export const minimalGraphicalSchemaField: GraphicalSchemaField = {
  itemType: "GraphicalSchemaField",
  name: "ПолеГрафическойСхемы",
}

export const minimalGraphicalSchemaFieldPartialYAML: GraphicalSchemaFieldPartialYAML = {}
