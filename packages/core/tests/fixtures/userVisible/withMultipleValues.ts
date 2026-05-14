import { UserVisible } from "~/metadata/commonObjects/userVisible/types"

export const withMultipleValuesUserVisible: UserVisible = {
  common: true,
  values: [
    {
      name: "Role.Администратор",
      value: true,
    },
    {
      name: "Role.Пользователь",
      value: false,
    },
  ],
}
