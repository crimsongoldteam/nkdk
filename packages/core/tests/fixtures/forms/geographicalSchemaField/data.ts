import { GeographicalSchemaField, GeographicalSchemaFieldEnterprise } from "~/metadata/forms/elements/geographicalSchemaField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullGeographicalSchemaField: GeographicalSchemaField = {
  elementType: FormElementType.GeographicalSchemaField,
  name: "ПолеГеографическойСхемы",
  id: "1",
  title: {
    items: { ru: "Поле географической схемы" },
  },
  autoMaxHeight: true,
  autoMaxWidth: true,
  height: 200,
  horizontalStretch: true,
  maxHeight: 500,
  maxWidth: 400,
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  verticalStretch: true,
  width: 300,
}

export const fullGeographicalSchemaFieldEnterprise: GeographicalSchemaFieldEnterprise = {
  Заголовок: "Поле географической схемы",
  АвтоМаксимальнаяВысота: "Истина",
  АвтоМаксимальнаяШирина: "Истина",
  Вывод: "Использовать",
  Высота: 200,
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  РазрешитьИспользование: { Администратор: "Истина" },
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  ЦветРамки: "Черный",
  Ширина: 300,
}

export const minimalGeographicalSchemaField: GeographicalSchemaField = {
  elementType: FormElementType.GeographicalSchemaField,
  name: "ПолеГеографическойСхемы",
  id: "1",
}

export const minimalGeographicalSchemaFieldEnterprise: GeographicalSchemaFieldEnterprise = {}

