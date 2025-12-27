import { UserVisible } from "~/metadata/commonObjects/userVisible/types"

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
