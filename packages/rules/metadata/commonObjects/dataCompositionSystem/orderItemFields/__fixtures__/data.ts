import { OrderItemFields, OrderItemFieldsYAML } from "../types"

export const dcsOrderItemFieldsFixture = [
  {
    itemType: "OrderItemField",
    field: "ПоВозрастанию",
  },
  {
    itemType: "OrderItemField",
    field: "ПоУбыванию",
    orderType: "Desc",
  },
] as const satisfies OrderItemFields

export const dcsOrderItemFieldsYAMLFixture = [
  {
    Поле: "ПоВозрастанию",
  },
  {
    Поле: "ПоУбыванию",
    ТипУпорядочивания: "Убыв",
  },
] as const satisfies OrderItemFieldsYAML
