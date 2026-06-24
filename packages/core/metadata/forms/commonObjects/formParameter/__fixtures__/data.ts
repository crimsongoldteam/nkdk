import type { FormParameters, FormParametersYAML } from "../types"

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

export const withoutTypeFormParameters: FormParameters = [
  {
    name: "ПараметрБезТипа",
  },
]
