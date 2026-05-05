import type {
  SettingsParameterValueCollection,
  SettingsParameterValueCollectionYAML,
} from "../types"

export const settingsParameterValueCollectionFixture = {
  itemType: "SettingsParameterValueCollection",
  parameters: {
    Параметр1: {
      parameter: "Параметр1",
      value: "ПараметрыДанных.Параметр1",
    },
  },
} as const satisfies SettingsParameterValueCollection

export const settingsParameterValueCollectionFixtureYAML = {
  Параметр1: "ПараметрыДанных.Параметр1",
} as const satisfies SettingsParameterValueCollectionYAML
