import { Context } from "../../context/types"
import { MetadataTabularSection } from "./types"

export const getDefaults = (_data: MetadataTabularSection, _context: Context): Partial<MetadataTabularSection> => {
  return {
    fillChecking: "DontCheck",
    use: "ForItem",
    lineNumberLength: 5,
  }
}
