import { ConfigurationContextFromXML } from "../context/types"
import { SystemEnumerationDcsValueRootXML } from "./dcsTypes"
import { SystemEnumerationPropertyRule } from "./types"
import { resolveSystemEnumerationXsiType } from "./toDcsXML"

const textNode = (value: string | { "#text"?: string } | undefined): string => {
  if (value === undefined) {
    throw new Error("DCS SystemEnumeration: expected text value")
  }
  if (typeof value === "string") {
    return value
  }
  const t = value["#text"]
  if (typeof t === "string") {
    return t
  }
  throw new Error("DCS SystemEnumeration: invalid text node")
}

export const importSystemEnumerationFromDcsXML = (
  _context: ConfigurationContextFromXML,
  rule: SystemEnumerationPropertyRule,
  xml: SystemEnumerationDcsValueRootXML
): string => {
  const root = xml["dcscor:value"]
  if (root === undefined) {
    throw new Error("DCS SystemEnumeration: missing dcscor:value")
  }

  const expected = resolveSystemEnumerationXsiType(rule.typeSE)
  if (typeof root === "object" && root !== null && "_xsi:type" in root) {
    const actual = root["_xsi:type"]
    if (actual !== expected) {
      throw new Error(`DCS SystemEnumeration: expected xsi:type ${expected}, got ${String(actual)}`)
    }
  }

  return textNode(root as string | { "#text"?: string })
}
