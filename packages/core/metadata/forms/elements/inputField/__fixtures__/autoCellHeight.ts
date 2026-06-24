import type { InputField } from "../types"

export const autoCellHeightInputField = {
  itemType: "InputField",
  name: "ПолеАвтоВысотаЯчейки",
  autoCellHeight: true,
} as const satisfies InputField
