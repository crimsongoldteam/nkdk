import { isXmlElementNode, xmlAttributeValue, xmlElementChildren, type XmlElementNode } from "@nkdk/runtime"
import { readBooleanXML } from "./boolean/xmlValue"

interface VisibilityXML {
  "xr:Common"?: unknown
  "xr:Value"?: RoleXML | RoleXML[]
}
interface RoleXML {
  _name?: string
  name?: string
  "#text"?: unknown
}

export function readRoleVisibilityXML(xml: VisibilityXML | XmlElementNode | undefined): {
  common?: boolean
  roles?: Record<string, boolean>
} | undefined {
  if (xml === undefined) return undefined
  const result: { common?: boolean; roles?: Record<string, boolean> } = {}
  const common = readBooleanXML(isXmlElementNode(xml) ? xmlElementChildren(xml, "xr:Common")[0] : xml["xr:Common"])
  if (common !== undefined) result.common = common
  const values = isXmlElementNode(xml) ? xmlElementChildren(xml, "xr:Value") : xml["xr:Value"]
  for (const role of values === undefined ? [] : Array.isArray(values) ? values : [values]) {
    const name = isXmlElementNode(role) ? xmlAttributeValue(role, "name") : role._name ?? role.name
    const value = readBooleanXML(isXmlElementNode(role) ? role : role["#text"])
    if (name !== undefined && value !== undefined) (result.roles ??= {})[name] = value
  }
  return Object.keys(result).length === 0 ? undefined : result
}
