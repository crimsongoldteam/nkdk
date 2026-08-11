import { ExchangePlanContent, ExchangePlanContentYAML } from "../types"

type ExchangePlanContentItem = NonNullable<ExchangePlanContent["items"]>[number]
type ExchangePlanContentFromCompactYAML = Omit<ExchangePlanContent, "items"> & {
  items: [Omit<ExchangePlanContentItem, "autoRecord">, ExchangePlanContentItem]
}

const contentItems: [ExchangePlanContentItem, ExchangePlanContentItem] = [
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
]

export const content: ExchangePlanContent = {
  itemType: "ExchangePlanContent",
  items: contentItems,
}

export const contentFromCompactYAML: ExchangePlanContentFromCompactYAML = {
  itemType: "ExchangePlanContent",
  items: [
    {
      itemType: "ExchangePlanContentItem",
      metadata: "Catalog.Номенклатура",
    },
    contentItems[1],
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
