import { MetadataAttributes } from "~/metadata/commonObjects/metadataAttribute/types"

export const singleAttributes: MetadataAttributes = [
  {
    name: "РеквизитОбъекта",
    synonym: { items: { ru: "Реквизит какого-то объекта" } },
    type: { type: ["string"] },
    minValue: 1,
    maxValue: 3,
    fillValue: {
      type: "ref",
      value: "Enum.ТипыНоменклатуры.EnumValue.Товар",
    },
  },
]
