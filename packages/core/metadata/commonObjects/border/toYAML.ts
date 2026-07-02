import type { PropertyRule } from "../../orchestration/property/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { exportSystemEnumerationToYAMLDeprecated } from "../../systemEnumerations/toYAML"
import * as SE from "../../systemEnumerations/types"
import { formatMetadataTargetToYAML } from "../metadataTargets"
import { borderStyleItemTarget, type Border, type BorderYAML } from "./types"

export const exportBorderToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: Border | undefined
): BorderYAML | undefined => {
  if (!data) return undefined

  const result: BorderYAML = {}

  if (data.ref !== undefined) {
    result.Имя = exportStyleItemRefToYAML(data.ref)
  }

  if (data.width !== undefined) {
    result.Ширина = data.width
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
    constraint: borderStyleItemTarget,
  })
}

registerTypeRule("Border", "exportToYAML", exportBorderToYAML)
