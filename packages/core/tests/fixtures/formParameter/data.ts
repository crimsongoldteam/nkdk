import { FormParameters, FormParametersEnterprise } from "~/metadata/forms/commonObjects/formParameter/types"

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

export const fullFormParametersEnterprise: FormParametersEnterprise = {
  КлючевойПараметр: {
    Тип: "Булево",
    Ключевой: true,
  },
  Параметр: {
    Тип: "Булево",
  },
}
