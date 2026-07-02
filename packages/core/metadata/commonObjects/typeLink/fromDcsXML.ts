import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { ConfigurationContextFromXML } from "../../context/types"
import { MetadataField } from "../metadataField/types"
import type { TypeLink, TypeLinkDcsValueRootXML } from "./types"

const textNode = (value: string | { "#text"?: string } | undefined): string => {
  if (value === undefined) {
    throw new Error("DCS TypeLink: expected dcscor:field")
  }
  if (typeof value === "string") {
    return value
  }
  const t = value["#text"]
  if (typeof t === "string") {
    return t
  }
  throw new Error("DCS TypeLink: invalid dcscor:field text")
}

const linkItemNumber = (value: number | string | { "#text"?: string } | undefined): number => {
  if (value === undefined) {
    throw new Error("DCS TypeLink: expected dcscor:linkItem")
  }
  if (typeof value === "number") {
    return value
  }
  if (typeof value === "string") {
    return Number(value)
  }
  const t = value["#text"]
  if (typeof t === "string") {
    return Number(t)
  }
  throw new Error("DCS TypeLink: invalid dcscor:linkItem")
}

export const importFromDcsXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: TypeLinkDcsValueRootXML
): TypeLink => {
  const root = xml["dcscor:value"]
  if (!root) {
    throw new Error("DCS TypeLink: missing dcscor:value")
  }

  const dataPath = textNode(root["dcscor:field"]) as MetadataField
  const linkItem = linkItemNumber(root["dcscor:linkItem"])

  return {
    dataPath,
    linkItem,
  }
}
