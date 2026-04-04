import type { DataParameters, DataParametersYAML } from "../types"

export const dataParametersFixture = {
  itemType: "DataParameters",
  parameters: {
    itemType: "SettingsParameterValueCollection",
    parameters: {
      Параметр1: {
        parameter: "Параметр1",
        value: "ПараметрыДанных.Параметр1",
      },
    },
  },
} as const satisfies DataParameters

export const dataParametersFixtureYAML = {
  ПараметрыДанных: {
    Параметр1: "ПараметрыДанных.Параметр1",
  },
} as const satisfies DataParametersYAML
