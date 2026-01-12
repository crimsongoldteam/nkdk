import {
  GeographicalSchemaField,
  GeographicalSchemaFieldPartialEnterprise,
  GeographicalSchemaFieldTypedEnterprise,
} from "~/metadata/forms/elements/geographicalSchemaField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullFormField, fullFormFieldEnterprise } from "../formField/data"

export const fullGeographicalSchemaField: GeographicalSchemaField = {
  ...fullFormField,
  elementType: FormElementType.GeographicalSchemaField,
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
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  verticalStretch: true,
  width: 300,
}

export const fullGeographicalSchemaFieldPartialEnterprise: GeographicalSchemaFieldPartialEnterprise = {
  ...fullFormFieldEnterprise,
  Заголовок: "Поле географической схемы",
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
}

export const fullGeographicalSchemaFieldTypedEnterprise: GeographicalSchemaFieldTypedEnterprise = {
  ...fullGeographicalSchemaFieldPartialEnterprise,
  Тип: "ПолеГеографическойСхемы",
}

export const minimalGeographicalSchemaField: GeographicalSchemaField = {
  elementType: FormElementType.GeographicalSchemaField,
  name: "ПолеГеографическойСхемы",
}

export const minimalGeographicalSchemaFieldPartialEnterprise: GeographicalSchemaFieldPartialEnterprise = {}

export const minimalGeographicalSchemaFieldTypedEnterprise: GeographicalSchemaFieldTypedEnterprise = {
  Тип: "ПолеГеографическойСхемы",
}
