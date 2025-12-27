import { ChoiceParameters } from "~/metadata/commonObjects/сhoiceParameter/types"

export const formBooleanChoiceParameter: ChoiceParameters = [
  {
    name: "БезПроизводныхЗначений",
    value: {
      type: "formChoiceListDesTimeValue",
      value: {
        type: "boolean",
        value: true,
      },
    },
  },
]
