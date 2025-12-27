import { IFormatterParams } from "../types"

export const formatGroupWrapping = (lines: string[], _params: IFormatterParams): string[] => {
  return [...lines]
  // if (params.wrapInGroup != WrapInGroupStrategy.Always) {
  //   return lines
  // }
  // const firstLine = params.isFirst ? "#" : ""
  // return addIndents([firstLine, ...lines], params)
}
