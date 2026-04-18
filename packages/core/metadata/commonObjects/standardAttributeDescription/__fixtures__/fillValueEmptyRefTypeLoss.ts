import { StandardAttributeDescriptions } from "~/metadata/commonObjects/standardAttributeDescription/types"

export const fillValueEmptyRefTypeLoss = [
  {
    itemType: "StandardAttributeDescription",
    name: "Ref",
    fillValue: {
      type: "ref",
      value: "",
    },
  },
] as const satisfies StandardAttributeDescriptions
