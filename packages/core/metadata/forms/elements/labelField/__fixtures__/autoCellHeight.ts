import type { LabelField } from "../types"

export const autoCellHeightLabelField = {
  itemType: "LabelField",
  name: "НадписьАвтоВысотаЯчейки",
  autoCellHeight: true,
} as const satisfies LabelField
