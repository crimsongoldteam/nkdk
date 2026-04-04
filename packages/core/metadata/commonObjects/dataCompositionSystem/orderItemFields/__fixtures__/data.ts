import { OrderItemFields, OrderItemFieldsYAML } from "../types"

export const dcsOrderItemFieldsFixture = [
  {
    itemType: "OrderItemField",
    field: "ПоВозрастанию",
    orderType: "Asc",
  },
  {
    itemType: "OrderItemField",
    field: "ПоУбыванию",
    orderType: "Desc",
  },
] as const satisfies OrderItemFields[]

export const dcsOrderItemFieldsYAMLFixture = [
  {
    Поле: "ПоВозрастанию",
    ТипУпорядочивания: "ПоВозрастанию",
  },
  {
    Поле: "ПоУбыванию",
    ТипУпорядочивания: "ПоУбыванию",
  },
] as const satisfies OrderItemFieldsYAML[]
