import { UserVisible } from "~/packages/core/metadata/commonObjects/userVisible/types"

export const withSingleValueUserVisible: UserVisible = {
  common: true,
  values: [
    {
      name: "Менеджер",
      value: true,
    },
  ],
}
