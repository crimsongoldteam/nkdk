import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { importMetadataItemFromXML } from "~/metadata/orchestration/metadataItem/fromXML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { GroupItemFieldRules } from "./rules"
import type { GroupItemField } from "./types"

export const importGroupItemFieldFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: unknown
): GroupItemField | undefined => {
  if (!xml || typeof xml !== "object") return undefined
  return importMetadataItemFromXML({ context, rule: GroupItemFieldRules, xml })
}

registerTypeRule("GroupItemField", "importFromXML", importGroupItemFieldFromXML as any)
