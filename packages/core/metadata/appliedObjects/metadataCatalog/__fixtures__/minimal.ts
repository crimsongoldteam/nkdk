import { MetadataCatalog, MetadataCatalogYAML } from "../types"

export const minimal: MetadataCatalog = {
  inputByString: [],
  itemType: "MetadataCatalog",
  name: "ПоУмолчанию",
  synonym: {
    items: {
      ru: "По умолчанию",
    },
  },
}

export const minimalYAML: MetadataCatalogYAML = {
  Синоним: "По умолчанию",
}
