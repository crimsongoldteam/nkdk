import { ChoiceList, ChoiceListYAML } from "~/metadata/commonObjects/choiceList/types"

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

export const oneItemChoiceListYAML: ChoiceListYAML = ['"Значение1"(Значение 1)']

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

export const twoItemsChoiceListYAML: ChoiceListYAML = ['"Значение1"(Значение 1)', "2(Значение 2)"]

export const emptyValueChoiceList: ChoiceList = [
  {
    type: "formChoiceListDesTimeValue",
    presentation: { items: { ru: "Пустое значение" } },
    value: undefined,
  },
]

export const emptyValueChoiceListYAML: ChoiceListYAML = ["(Пустое значение)"]
