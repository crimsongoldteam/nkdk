import { UserVisible } from "~/metadata/commonObjects/userVisible/types"

export const withSingleValueUserVisible: UserVisible = {
  common: true,
  values: [
    {
      name: "Менеджер",
      value: true,
    },
  ],
}
