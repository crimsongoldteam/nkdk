import { MetadataEnumeration, MetadataEnumerationYAML } from "../types"

export const minimal = {
  itemType: "MetadataEnumeration",
  name: "ПеречислениеПоУмолчанию",
  synonym: {
    items: {
      ru: "Перечисление по умолчанию",
    },
  },
} satisfies MetadataEnumeration

export const minimalYAML: MetadataEnumerationYAML = {} satisfies MetadataEnumerationYAML
