import { MetadataAttributes } from "~/packages/core/metadata/commonObjects/metadataAttribute/types"

export const multipleAttributes: MetadataAttributes = [
  {
    name: "РеквизитОбъекта1",
    synonym: { items: { ru: "Реквизит какого-то объекта 1" } },
    type: { type: ["string"] },
  },
  {
    name: "РеквизитОбъекта2",
    synonym: { items: { ru: "Реквизит какого-то объекта 2" } },
    type: { type: ["string"] },
  },
]
