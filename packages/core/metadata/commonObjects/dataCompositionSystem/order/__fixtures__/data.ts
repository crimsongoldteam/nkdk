import type { Order } from "../types"

export const orderFixture = {
  itemType: "Order",
  items: [
    { itemType: "OrderItemField", field: "Наименование" },
    { itemType: "OrderItemField", field: "Ссылка.Код", orderType: "Desc" },
  ],
  userSettingID: true,
  userSettingPresentation: { items: { ru: "Представление порядка" } },
} as const satisfies Order

export const fullOrderFixtureYAML = {
  Элементы: [
    { Поле: "Наименование" },
    { Поле: "Ссылка.Код", ТипУпорядочивания: "Убыв" },
  ],
  ИспользоватьПользовательскуюНастройку: "Истина",
  ПредставлениеПользовательскойНастройки: "Представление порядка",
} as const
