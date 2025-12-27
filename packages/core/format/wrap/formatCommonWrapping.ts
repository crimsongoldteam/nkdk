import { IFormatterParams, WrapInGroupStrategy } from "../types"
import { addIndents as addIndents } from "./addIndents"

export const formatCommonWrapping = (lines: string[], params: IFormatterParams): string[] => {
  if (params.wrapInGroup === WrapInGroupStrategy.None) {
    return lines
  }

  return addIndents(lines, params)
}
