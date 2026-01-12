import {
  GraphicalSchemaField,
  GraphicalSchemaFieldPartialEnterprise,
  GraphicalSchemaFieldTypedEnterprise,
} from "~/metadata/forms/elements/graphicalSchemaField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullFormField, fullFormFieldEnterprise } from "../formField/data"

export const fullGraphicalSchemaField: GraphicalSchemaField = {
  ...fullFormField,
  elementType: FormElementType.GraphicalSchemaField,
  name: "ПолеГрафическойСхемы",
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
  output: "Enable",
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  verticalStretch: true,
  width: 300,
}

export const fullGraphicalSchemaFieldPartialEnterprise: GraphicalSchemaFieldPartialEnterprise = {
  ...fullFormFieldEnterprise,
  Заголовок: "Поле графической схемы",
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
}

export const fullGraphicalSchemaFieldTypedEnterprise: GraphicalSchemaFieldTypedEnterprise = {
  ...fullGraphicalSchemaFieldPartialEnterprise,
  Тип: "ПолеГрафическойСхемы",
}

export const minimalGraphicalSchemaField: GraphicalSchemaField = {
  elementType: FormElementType.GraphicalSchemaField,
  name: "ПолеГрафическойСхемы",
}

export const minimalGraphicalSchemaFieldPartialEnterprise: GraphicalSchemaFieldPartialEnterprise = {}

export const minimalGraphicalSchemaFieldTypedEnterprise: GraphicalSchemaFieldTypedEnterprise = {
  Тип: "ПолеГрафическойСхемы",
}
