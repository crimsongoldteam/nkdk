import { FormParameters, FormParametersYAML } from "~/metadata/forms/commonObjects/formParameter/types"

export const fullFormParameters: FormParameters = [
  {
    name: "КлючевойПараметр",
    type: {
      type: ["boolean"],
    },
    keyParameter: true,
  },
  {
    name: "Параметр",
    type: {
      type: ["boolean"],
    },
  },
]

export const fullFormParametersYAML: FormParametersYAML = {
  КлючевойПараметр: {
    Тип: "Булево",
    Ключевой: true,
  },
  Параметр: {
    Тип: "Булево",
  },
}
