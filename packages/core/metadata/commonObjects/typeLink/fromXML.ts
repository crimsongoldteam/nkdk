import { importNumberFromXML } from "~/metadata/commonObjects/number/fromXML"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { MetadataField } from "../metadataField/types"
import type { TypeLink, TypeLinkXML } from "./types"

export const importTypeLinkFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: TypeLinkXML | undefined
): TypeLink | undefined => {
  if (!xml) return undefined

  const dataPath = typeof xml["xr:DataPath"] === "string" ? xml["xr:DataPath"] : xml["xr:DataPath"]["#text"]
  const linkItem = importNumberFromXML(_context, undefined, xml["xr:LinkItem"])

  const result: TypeLink = {
    dataPath: dataPath as MetadataField,
    linkItem: linkItem ?? 0,
  }

  return result
}

registerTypeRule("TypeLink", "importFromXML", importTypeLinkFromXML)
