import { ExchangePlanContent, ExchangePlanContentYAML } from "../types"

export const content: ExchangePlanContent = {
  itemType: "ExchangePlanContent",
  items: [
    {
      itemType: "ExchangePlanContentItem",
      metadata: "Catalog.Номенклатура",
      autoRecord: "Allow",
    },
    {
      itemType: "ExchangePlanContentItem",
      metadata: "Document.Заказ",
      autoRecord: "Deny",
    },
  ],
}

export const contentFromCompactYAML: ExchangePlanContent = {
  itemType: "ExchangePlanContent",
  items: [
    {
      itemType: "ExchangePlanContentItem",
      metadata: "Catalog.Номенклатура",
    },
    content.items[1],
  ],
}

export const contentYAML: ExchangePlanContentYAML = [
  {
    Метаданные: "Справочник.Номенклатура",
  },
  {
    Метаданные: "Документ.Заказ",
    Авторегистрация: "Запретить",
  },
]
