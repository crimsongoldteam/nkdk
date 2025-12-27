import { UserVisible } from "~/packages/core/metadata/commonObjects/userVisible/types"

export const withMultipleValuesUserVisible: UserVisible = {
  common: true,
  values: [
    {
      name: "Администратор",
      value: true,
    },
    {
      name: "Пользователь",
      value: false,
    },
  ],
}
