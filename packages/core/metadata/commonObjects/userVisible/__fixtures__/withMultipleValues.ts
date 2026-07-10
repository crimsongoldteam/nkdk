import { UserVisible } from "../types"

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
