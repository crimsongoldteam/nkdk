import { IFormatterParams, WrapInGroupStrategy } from "../types"
import { addIndents } from "./addIndents"

export const formatCommonWrapping = (lines: string[], params: IFormatterParams): string[] => {
  if (params.wrapInGroup === WrapInGroupStrategy.None) {
    return lines
  }

  return addIndents(lines, params)
}
