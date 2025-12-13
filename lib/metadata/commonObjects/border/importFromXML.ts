import type { ControlBorderType } from "~/lib/metadata/systemEnumerations/types"
import { Border, BorderXML } from "./types"

export const importBorderFromXML = (
  xml: BorderXML | { Border: BorderXML } | undefined
): Border | undefined => {
  if (!xml) return undefined

  const node: BorderXML = (
    "Border" in (xml as any) ? (xml as any).Border : xml
  ) as BorderXML

  const style = node["v8ui:style"]
  const controlBorderType: ControlBorderType | undefined =
    typeof style === "string"
      ? (style as ControlBorderType)
      : style && typeof style === "object"
        ? (style["#text"] as ControlBorderType | undefined)
        : undefined

  const result: Border = {}

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
