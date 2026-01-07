import { GraphicalSchemaField, GraphicalSchemaFieldEnterprise } from "~/metadata/forms/elements/graphicalSchemaField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullGraphicalSchemaField: GraphicalSchemaField = {
  elementType: FormElementType.GraphicalSchemaField,
  name: "ПолеГрафическойСхемы",
  id: "1",
  title: {
    items: { ru: "Поле графической схемы" },
  },
  autoMaxHeight: true,
  autoMaxWidth: true,
  borderColor: { type: "WebColor", value: "Black" },
  edit: true,
  height: 200,
  horizontalStretch: true,
  maxHeight: 500,
  maxWidth: 400,
  output: "Use",
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  verticalStretch: true,
  width: 300,
}

export const fullGraphicalSchemaFieldEnterprise: GraphicalSchemaFieldEnterprise = {
  Заголовок: "Поле графической схемы",
  АвтоМаксимальнаяВысота: "Истина",
  АвтоМаксимальнаяШирина: "Истина",
  Вывод: "Использовать",
  Высота: 200,
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  РазрешитьИспользование: { Администратор: "Истина" },
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  Редактирование: "Истина",
  ЦветРамки: "Черный",
  Ширина: 300,
}

export const minimalGraphicalSchemaField: GraphicalSchemaField = {
  elementType: FormElementType.GraphicalSchemaField,
  name: "ПолеГрафическойСхемы",
  id: "1",
}

export const minimalGraphicalSchemaFieldEnterprise: GraphicalSchemaFieldEnterprise = {}

