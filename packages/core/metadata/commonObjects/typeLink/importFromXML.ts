import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { ConfigurationContext } from "../../context/types"
import { MetadataField } from "../metadataField/types"
import { TypeLink, TypeLinkXML } from "./types"

export const importTypeLinkFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  xml: TypeLinkXML | undefined
): TypeLink | undefined => {
  if (!xml) return undefined

  const dataPath = typeof xml["xr:DataPath"] === "string" ? xml["xr:DataPath"] : xml["xr:DataPath"]["#text"]

  const result: TypeLink = {
    dataPath: dataPath as MetadataField,
    linkItem: xml["xr:LinkItem"],
  }

  return result
}

registerTypeRule("TypeLink", "importFromXML", importTypeLinkFromXML)
