import { MetadataCatalog } from "~/lib/metadata/appliedObjects/metadataCatalog/types"

export const withAttributesCatalog: MetadataCatalog = {
  name: "Контрагенты",
  synonym: { items: { ru: "Контрагенты" } },
  attributes: [
    {
      name: "РеквизитОбъекта",
      synonym: { items: { ru: "Реквизит объекта" } },
      type: {
        type: ["string"],
      },
    },
  ],
}
