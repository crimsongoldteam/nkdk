import { MetadataFilterCriterion, MetadataFilterCriterionYAML } from "../types"

export const minimal: MetadataFilterCriterion = {
  itemType: "MetadataFilterCriterion",
  name: "КритерийОтбораПоУмолчанию",
  synonym: { items: { ru: "Критерий отбора по умолчанию" } },
}

export const minimalYAML: MetadataFilterCriterionYAML = {
  Синоним: "Критерий отбора по умолчанию",
}
