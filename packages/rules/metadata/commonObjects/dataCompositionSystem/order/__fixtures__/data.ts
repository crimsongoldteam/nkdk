import type { Order } from "../types"

export const orderFixture = {
  itemType: "Order",
  items: [
    { itemType: "OrderItemField", field: "Наименование" },
    { itemType: "OrderItemField", field: "Ссылка.Код", orderType: "Desc" },
    { itemType: "OrderItemField", field: "Артикул", use: false },
  ],
  userSettingID: "86a851e8-fef1-4353-9e75-59d215155503",
  userSettingPresentation: { items: { ru: "Представление порядка" } },
} as const satisfies Order

export const fullOrderFixtureYAML = {
  Элементы: [
    { Поле: "Наименование" },
    { Поле: "Ссылка.Код", ТипУпорядочивания: "Убыв" },
    { Поле: "Артикул", Использование: "Ложь" },
  ],
  ИспользоватьПользовательскуюНастройку: "86a851e8-fef1-4353-9e75-59d215155503",
  ПредставлениеПользовательскойНастройки: "Представление порядка",
} as const

export const autoOrderFixture = {
  itemType: "Order",
  items: [{ itemType: "OrderItemAuto" }],
} as const satisfies Order

export const autoOrderFixtureYAML = {
  Элементы: ["[Авто]"],
} as const
