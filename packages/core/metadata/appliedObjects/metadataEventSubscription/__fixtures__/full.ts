import { MetadataEventSubscription, MetadataEventSubscriptionYAML } from "../types"

export const full: MetadataEventSubscription = {
  itemType: "MetadataEventSubscription",
  name: "ПодпискаНаСобытиеВсеСвойства",
  synonym: { items: { ru: "Синоним" } },
  comment: "Комментарий",
  source: { type: ["CatalogObject.СправочникПолный"] },
  event: "OnSetNewCode",
  handler: "CommonModule.ОбщийМодульПодпискаНаСобытие.ПодпискаНаСобытиеВсеСвойстваПриУстановкеНовогоКода",
}

export const fullYAML: MetadataEventSubscriptionYAML = {
  Синоним: "Синоним",
  Комментарий: "Комментарий",
  Источник: "СправочникОбъект.СправочникПолный",
  Событие: "OnSetNewCode",
  Обработчик: "CommonModule.ОбщийМодульПодпискаНаСобытие.ПодпискаНаСобытиеВсеСвойстваПриУстановкеНовогоКода",
}
