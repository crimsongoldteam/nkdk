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

export const oneItemChoiceListEnterprise: ChoiceListEnterprise = ['"Значение1"(Значение 1)']

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

export const twoItemsChoiceListEnterprise: ChoiceListEnterprise = ['"Значение1"(Значение 1)', "2(Значение 2)"]
