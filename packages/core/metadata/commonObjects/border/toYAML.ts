import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { exportSystemEnumerationToYAMLDeprecated } from "../../systemEnumerations/toYAML"
import * as SE from "../../systemEnumerations/types"
import { formatMetadataTargetToYAML } from "../metadataTargets"
import { Border, BorderYAML } from "./types"

export const exportBorderToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: Border | undefined
): BorderYAML | undefined => {
  if (!data) return undefined

  const result: BorderYAML = {
    Имя: data.ref === undefined ? undefined : exportStyleItemRefToYAML(data.ref),
    Ширина: data.width,
  }

  const borderType = exportSystemEnumerationToYAMLDeprecated<SE.ControlBorderTypeYAML>(
    context,
    { type: "SystemEnumeration", typeSE: "ControlBorderType" },
    data.controlBorderType
  )
  if (borderType !== undefined) {
    result.ТипРамки = borderType
  }

  return result
}

function exportStyleItemRefToYAML(ref: string): string {
  return formatMetadataTargetToYAML({
    canonical: `StyleItem.${ref}`,
    constraint: { kind: "styleItem", styleItemTypes: ["Border"] },
  })
}

registerTypeRule("Border", "exportToYAML", exportBorderToYAML)
