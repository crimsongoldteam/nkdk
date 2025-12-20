import { ConfigurationSettings } from "../../configurationSettings/types"
import { MetadataTabularSection } from "./types"

export const getDefaults = (
  _data: MetadataTabularSection,
  _configurationSettings: ConfigurationSettings
): Partial<MetadataTabularSection> => {
  return {
    fillChecking: "DontCheck",
    use: "ForItem",
    lineNumberLength: 5,
  }
}
