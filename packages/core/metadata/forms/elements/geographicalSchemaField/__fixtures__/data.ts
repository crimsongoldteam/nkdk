import {
  GeographicalSchemaField,
  GeographicalSchemaFieldEnterprise,
  GeographicalSchemaFieldPartialYAML,
} from "../types"

import {
  fullFormFieldCommonFixture,
  fullFormFieldEnterpriseCommonFixture,
  fullFormFieldPartialYAMLCommonFixture,
} from "../../__fixtures__/formField/rules"
import { RequiredFieldsElement } from "../../../../../tests/types"

export const fullGeographicalSchemaField: RequiredFieldsElement<GeographicalSchemaField> = {
  itemType: "GeographicalSchemaField",
  name: "ПолеГеографическойСхемы",
  title: {
    items: { ru: "Поле географической схемы" },
  },
  autoMaxHeight: false,
  autoMaxWidth: false,
  borderColor: { type: "WebColor", value: "Black" },
  height: 200,
  horizontalStretch: false,
  maxHeight: 500,
  maxWidth: 400,
  output: "Enable",
  verticalStretch: false,
  width: 300,
  events: {
    onChange: "ПроцедураПриИзменении",
    detailProcessing: "ПроцедураОбработкиРасшифровки",
    beforePrint: "ПроцедураПередПечатью",
  },
  ...fullFormFieldCommonFixture,
}

export const fullGeographicalSchemaFieldEnterprise = {
  ElementType: "FormField",
  Name: "prefix_ПолеГеографическойСхемы",
  Type: {
    Type: "SystemEnumeration",
    Value: "FormFieldType.GeographicalSchemaField",
  },
  Title: "Поле географической схемы",
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
} satisfies Required<GeographicalSchemaFieldEnterprise>

export const fullGeographicalSchemaFieldPartialYAML: GeographicalSchemaFieldPartialYAML = {
  АвтоМаксимальнаяВысота: "Ложь",
  АвтоМаксимальнаяШирина: "Ложь",
  Вывод: "Разрешить",
  Высота: 200,
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  РастягиватьПоВертикали: "Ложь",
  РастягиватьПоГоризонтали: "Ложь",
  ЦветРамки: "Черный",
  Заголовок: "Поле географической схемы",
  Ширина: 300,
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
    ОбработкаРасшифровки: "ПроцедураОбработкиРасшифровки",
    ПередПечатью: "ПроцедураПередПечатью",
  },

  ...fullFormFieldPartialYAMLCommonFixture,
} satisfies Omit<Required<GeographicalSchemaFieldPartialYAML>, "Использование">

export const minimalGeographicalSchemaField: GeographicalSchemaField = {
  itemType: "GeographicalSchemaField",
  name: "ПолеГеографическойСхемы",
}

export const minimalGeographicalSchemaFieldPartialYAML: GeographicalSchemaFieldPartialYAML = {}
