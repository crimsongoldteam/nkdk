import { IFormatterParams, WrapInGroupStrategy } from "../types"
import { addIndents as addIndents } from "./addIndents"

export const formatGroupWrapping = (lines: string[], params: IFormatterParams): string[] => {
  if (params.wrapInGroup != WrapInGroupStrategy.Always) {
    return lines
  }

  const firstLine = params.isFirst ? "#" : ""
  return addIndents([firstLine, ...lines], params)
}
