import { ChoiceList, ChoiceListEnterprise } from "~/metadata/commonObjects/choiceList/types"

export const oneItemChoiceList: ChoiceList = [
  {
    type: "formChoiceListDesTimeValue",
    presentation: { items: { ru: "Значение 1" } },
    value: {
      type: "string",
      value: "Значение1",
    },
  },
]

export const oneItemChoiceListEnterprise: ChoiceListEnterprise = [
  {
    Представление: "Значение 1",
    Значение: "Значение1",
  },
]

export const twoItemsChoiceList: ChoiceList = [
  {
    type: "formChoiceListDesTimeValue",
    presentation: { items: { ru: "Значение 1" } },
    value: {
      type: "string",
      value: "Значение1",
    },
  },
  {
    type: "formChoiceListDesTimeValue",
    presentation: { items: { ru: "Значение 2" } },
    value: {
      type: "decimal",
      value: 2,
    },
  },
]

export const twoItemsChoiceListEnterprise: ChoiceListEnterprise = [
  {
    Представление: "Значение 1",
    Значение: "Значение1",
  },
  {
    Представление: "Значение 2",
    Значение: 2,
  },
]
