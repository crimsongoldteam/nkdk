import { ChoiceParameters } from "~/metadata/commonObjects/сhoiceParameter/types"

export const fixedArrayChoiceParameter: ChoiceParameters = [
  {
    name: "Отбор.ТипСтруктурнойЕдиницы",
    value: {
      type: "fixedArray",
      value: [
        {
          type: "ref",
          value: "Enum.ТипыСтруктурныхЕдиниц.EnumValue.Склад",
        },
        {
          type: "ref",
          value: "Enum.ТипыСтруктурныхЕдиниц.EnumValue.Розница",
        },
        {
          type: "ref",
          value: "Enum.ТипыСтруктурныхЕдиниц.EnumValue.РозницаСуммовойУчет",
        },
      ],
    },
  },
]
