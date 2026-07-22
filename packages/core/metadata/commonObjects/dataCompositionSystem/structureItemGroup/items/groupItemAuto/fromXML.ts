import { ConfigurationContextFromXML } from "../../../../../context/types"
import { importPropertyFromXML } from "../../../../../orchestration/property/fromXML"
import type { PropertyRule } from "../../../../../orchestration/property/types"
import { GroupItemAutoRules } from "./rules"
import type { GroupItemAuto } from "./types"

export const importGroupItemAutoFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: unknown
): GroupItemAuto | undefined => {
  if (!xml || typeof xml !== "object") return undefined
  const source = xml as Record<string, unknown>
  return {
    itemType: "GroupItemAuto",
    use: importPropertyFromXML({ context, rule: GroupItemAutoRules.properties.use, value: source["dcsset:use"] }),
  } as GroupItemAuto
}
