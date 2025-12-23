import { Context } from "../../context/types"
import { MetadataTabularSection } from "./types"

export const getDefaults = (
  _data: MetadataTabularSection,
  _configurationSettings: Context
): Partial<MetadataTabularSection> => {
  return {
    fillChecking: "DontCheck",
    use: "ForItem",
    lineNumberLength: 5,
  }
}
