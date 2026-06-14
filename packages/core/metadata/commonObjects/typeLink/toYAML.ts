import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataFieldToYAML } from "../metadataField/toYAML"
import { TypeLink, TypeLinkYAML } from "./types"

const typeLinkMetadataTargetRule = {
  type: "MetadataField",
  metadataTarget: { kind: "field", owner: "explicit", allowObject: true },
} as const satisfies PropertyRule

export const exportTypeLinkToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: TypeLink | undefined
): TypeLinkYAML | undefined => {
  if (!data) return undefined

  const dataPathYAML = exportMetadataFieldToYAML(context, typeLinkMetadataTargetRule, data.dataPath) ?? data.dataPath

  // Добавляем linkItem в скобках, если он не равен 0
  if (data.linkItem !== 0) {
    return `${dataPathYAML}(${data.linkItem})`
  }

  return dataPathYAML
}

registerTypeRule("TypeLink", "exportToYAML", exportTypeLinkToYAML)
