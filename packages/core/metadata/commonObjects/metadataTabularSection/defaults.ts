import { Context } from "../../context/types"
import { MetadataTabularSection } from "./types"

const defaults = {
  fillChecking: "DontCheck",
  use: "ForItem",
  lineNumberLength: 5,
} as const

export const getDefaults = (
  _context: Context,
  _data: MetadataTabularSection
): Required<Pick<MetadataTabularSection, keyof typeof defaults>> => {
  return defaults
}
