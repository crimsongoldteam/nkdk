import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { exportMetadataItemToXML } from "~/metadata/orchestration/metadataItem/toXML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { GroupItemAutoRules } from "./rules"
import type { GroupItemAuto } from "./types"

export const exportGroupItemAutoToXML = (
  context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule,
  value: GroupItemAuto | undefined,
  referenceMetadata?: GroupItemAuto
): Record<string, unknown> | undefined => {
  if (!value) return undefined
  const inner = exportMetadataItemToXML({
    context,
    data: value,
    rule: GroupItemAutoRules,
    referenceData: referenceMetadata,
  })
  return { "_xsi:type": "dcsset:GroupItemAuto", ...(inner ?? {}) }
}
