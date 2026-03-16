import {
  GeographicalSchemaField,
  GeographicalSchemaFieldEnterprise,
  GeographicalSchemaFieldPartialYAML,
} from "~/metadata/forms/elements/geographicalSchemaField/types"

import {
  fullFormFieldCommonFixture,
  fullFormFieldEnterpriseCommonFixture,
  fullFormFieldPartialYAMLCommonFixture,
} from "~/tests/fixtures/forms/base/formField/rules"
import { RequiredFieldsElement } from "~/tests/types"

export const fullGeographicalSchemaField: RequiredFieldsElement<GeographicalSchemaField> = {
  itemType: "GeographicalSchemaField",
  name: "ПолеГеографическойСхемы",
  title: {
    items: { ru: "Поле географической схемы" },
  },
  autoMaxHeight: true,
  autoMaxWidth: true,
  borderColor: { type: "WebColor", value: "Black" },
  height: 200,
  horizontalStretch: true,
  maxHeight: 500,
  maxWidth: 400,
  output: "Enable",
  verticalStretch: true,
  width: 300,
  events: {
    onChange: "ПроцедураПриИзменении",
    detailProcessing: "ПроцедураОбработкиРасшифровки",
    beforeWrite: "ПроцедураПередЗаписью",
    beforePrint: "ПроцедураПередПечатью",
    afterWrite: "ПроцедураПослеЗаписи",
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
  AutoMaxHeight: true,
  AutoMaxWidth: true,
  BorderColor: {
    Type: "Color",
    Value: "WebColors.Black",
  },
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
} satisfies Required<GeographicalSchemaFieldEnterprise>

export const fullGeographicalSchemaFieldPartialYAML: GeographicalSchemaFieldPartialYAML = {
  АвтоМаксимальнаяВысота: "Истина",
  АвтоМаксимальнаяШирина: "Истина",
  Вывод: "Разрешить",
  Высота: 200,
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  ЦветРамки: "Черный",
  Ширина: 300,
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
    ОбработкаРасшифровки: "ПроцедураОбработкиРасшифровки",
    ПередЗаписью: "ПроцедураПередЗаписью",
    ПередПечатью: "ПроцедураПередПечатью",
    ПослеЗаписи: "ПроцедураПослеЗаписи",
  },

  ...fullFormFieldPartialYAMLCommonFixture,
} satisfies Omit<Required<GeographicalSchemaFieldPartialYAML>, "ЗапретитьИспользование" | "Заголовок" | "РазрешитьИспользование">

export const minimalGeographicalSchemaField: GeographicalSchemaField = {
  itemType: "GeographicalSchemaField",
  name: "ПолеГеографическойСхемы",
}

export const minimalGeographicalSchemaFieldPartialYAML: GeographicalSchemaFieldPartialYAML = {}
