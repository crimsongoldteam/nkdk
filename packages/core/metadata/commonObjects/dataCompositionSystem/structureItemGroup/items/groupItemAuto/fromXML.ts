import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importMetadataItemFromXML } from "~/metadata/orchestration/metadataItem/fromXML"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { GroupItemAutoRules } from "./rules"
import type { GroupItemAuto } from "./types"

export const importGroupItemAutoFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: unknown
): GroupItemAuto | undefined => {
  if (!xml || typeof xml !== "object") return undefined
  return importMetadataItemFromXML({ context, rule: GroupItemAutoRules, xml })
}
