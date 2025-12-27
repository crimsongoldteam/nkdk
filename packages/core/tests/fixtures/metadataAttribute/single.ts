import { MetadataAttributes } from "~/packages/core/metadata/commonObjects/metadataAttribute/types"

export const singleAttribute: MetadataAttributes = [
  {
    name: "РеквизитОбъекта",
    synonym: { items: { ru: "Реквизит какого-то объекта" } },
    type: { type: ["string"] },
    minValue: 1,
    maxValue: 3,
  },
]
