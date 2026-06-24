import { UserSettingsIDYAML } from "../types"

export const fixtureUserSettingsIDFull = true as const
export const fixtureUserSettingsIDRefFull = "911b6018-f537-43e8-a417-da56b22f9aec" as const

export const fixtureUserSettingsIDYAML = "Истина" as const satisfies UserSettingsIDYAML
export const fixtureUserSettingsIDFalseYAML = "Ложь" as const satisfies UserSettingsIDYAML
