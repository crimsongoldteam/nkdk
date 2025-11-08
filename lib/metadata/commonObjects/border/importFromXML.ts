import { TBorder, TBorderXML } from "./types"
import type { TControlBorderType } from "~/lib/metadata/systemEnumerations/types"

export const importBorderFromXML = (
  xml: TBorderXML | { Border: TBorderXML } | undefined
): TBorder | undefined => {
  if (!xml) return undefined

  const node: TBorderXML = (
    "Border" in (xml as any) ? (xml as any).Border : xml
  ) as TBorderXML
  console.log("node:", JSON.stringify(node, null, 2))

  const style = node["v8ui:style"]
  const controlBorderType: TControlBorderType | undefined =
    typeof style === "string"
      ? (style as TControlBorderType)
      : style && typeof style === "object"
      ? (style["#text"] as TControlBorderType | undefined)
      : undefined

  const result: TBorder = {}

  if (node._ref !== undefined) {
    result.ref = node._ref
  }
  if (node._width !== undefined) {
    result.width = Number(node._width)
  }
  if (controlBorderType !== undefined) {
    result.controlBorderType = controlBorderType
  }

  return result
}
