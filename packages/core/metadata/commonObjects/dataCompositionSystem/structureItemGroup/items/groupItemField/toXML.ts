import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { exportMetadataItemToXML } from "~/metadata/orchestration/metadataItem/toXML"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { GroupItemFieldRules } from "./rules"
import type { GroupItemField } from "./types"

export const exportGroupItemFieldToXML = (
  context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule,
  value: GroupItemField | undefined,
  referenceMetadata?: GroupItemField
): Record<string, unknown> | undefined => {
  if (!value) return undefined
  const inner = exportMetadataItemToXML({
    context,
    data: value,
    rule: GroupItemFieldRules,
    referenceData: referenceMetadata,
  })
  return { "_xsi:type": "dcsset:GroupItemField", ...(inner ?? {}) }
}

registerTypeRule("GroupItemField", "exportToXML", exportGroupItemFieldToXML as any)
