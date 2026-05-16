import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { XDTOTypeName } from "./types"

type XDTOTypeNameXMLObject = {
  "#text"?: string | number
  [attribute: `_xmlns${string}`]: string | undefined
}

const isXDTOTypeNameXMLObject = (value: unknown): value is XDTOTypeNameXMLObject => {
  return value !== null && typeof value === "object" && "#text" in value
}

export const importXDTOTypeNameFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  value: string | number | XDTOTypeNameXMLObject | undefined
): XDTOTypeName | XDTOTypeNameXMLObject | undefined => {
  if (value === undefined) return undefined
  if (isXDTOTypeNameXMLObject(value)) {
    const text = value["#text"]
    if (text === undefined) return undefined
    return context.fromXML.forReference ? value : text.toString()
  }
  if (value !== null && typeof value === "object") return undefined
  return value.toString()
}

registerTypeRule("XDTOTypeName", "importFromXML", importXDTOTypeNameFromXML)
