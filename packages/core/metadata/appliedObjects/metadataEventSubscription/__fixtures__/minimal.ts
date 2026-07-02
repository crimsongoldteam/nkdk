import { MetadataEventSubscription, MetadataEventSubscriptionYAML } from "../types"

export const minimal: MetadataEventSubscription = {
  itemType: "MetadataEventSubscription",
  name: "ПодпискаНаСобытиеПоУмолчанию",
  synonym: { items: { ru: "Подписка на событие по умолчанию" } },
  source: { type: ["CatalogObject.СправочникПолный"] },
  event: "OnSetNewCode",
  handler: "CommonModule.ОбщийМодульПодпискаНаСобытие.ПодпискаНаСобытиеВсеСвойстваПриУстановкеНовогоКода",
}

export const minimalYAML: MetadataEventSubscriptionYAML = {
  Источник: "СправочникОбъект.СправочникПолный",
  Событие: "OnSetNewCode",
  Обработчик: "CommonModule.ОбщийМодульПодпискаНаСобытие.ПодпискаНаСобытиеВсеСвойстваПриУстановкеНовогоКода",
}
